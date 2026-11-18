import { test, expect, type APIRequestContext } from '@playwright/test';
import { homepage } from '../ukhsa';

// These tests use GOV.UK's public APIs for the UKHSA homepage, plus the page itself over HTTP.
// The page content changes often (news, featured items), so tests check status, content type
// and shape rather than exact data where possible. Keep the number of requests low - GOV.UK
// rate limits automated traffic.

// The organisation's identifier ("slug") used in GOV.UK URLs and APIs
const slug = 'uk-health-security-agency';

// Longer non-JSON bodies (e.g. HTML pages) are cut to this many characters in the log
const maxTextLength = 500;

// GOV.UK API responses can be very large - longer JSON bodies are cut to this many characters in the log
const maxJsonLength = 5000;

// Sends a GET request, prints the request and response as JSON to the console
// and attaches them to the HTML report, then returns the response as normal.
// The description explains in plain English what the call is checking - it appears
// at the top of each call in the console, the HTML report and api-results/api-log.json
async function get(request: APIRequestContext, url: string, description: string, options?: Parameters<APIRequestContext['get']>[1]) {
  const response = await request.get(url, options);

  const contentType = response.headers()['content-type'] ?? '';
  let body: unknown;
  if (contentType.includes('application/json')) {
    const json = await response.json();
    const text = JSON.stringify(json);
    body = text.length > maxJsonLength ? `${text.slice(0, maxJsonLength)}... (${text.length} characters in total)` : json;
  } else {
    const text = await response.text();
    body = text.length > maxTextLength ? `${text.slice(0, maxTextLength)}... (${text.length} characters in total)` : text;
  }

  const log = {
    description,
    request: { method: 'GET', url: response.url(), options: options ?? {} },
    response: { status: response.status(), statusText: response.statusText(), headers: response.headers(), body },
  };

  const json = JSON.stringify(log, null, 2);
  console.log(`\n=== ${test.info().title} ===\n${json}`);
  await test.info().attach(`GET ${url}`, { body: json, contentType: 'application/json' });

  return response;
}

test.describe('Content API', () => {
  test('returns the UKHSA homepage content as JSON', async ({ request }) => {
    const response = await get(request, `/api/content${homepage}`,
      'Requests the UKHSA homepage from the GOV.UK Content API and checks it returns the organisation page as JSON');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const content = await response.json();
    expect(content.title).toBe('UK Health Security Agency');
    expect(content.base_path).toBe(homepage);
    expect(content.document_type).toBe('organisation');
    expect(content.locale).toBe('en');
    expect(content.details.acronym).toBe('UKHSA');
    expect(content.details.organisation_govuk_status.status).toBe('live');
  });

  test('lists the parent organisation as the Department of Health and Social Care', async ({ request }) => {
    const content = await (await get(request, `/api/content${homepage}`,
      'Requests the UKHSA homepage from the Content API and checks the Department of Health and Social Care is listed as its parent organisation')).json();

    const parents: { title: string }[] = content.links.ordered_parent_organisations ?? [];
    expect(parents.map(p => p.title)).toContain('Department of Health and Social Care');
  });
});

test.describe('Organisations API', () => {
  test('returns the UKHSA organisation details', async ({ request, baseURL }) => {
    const response = await get(request, `/api/organisations/${slug}`,
      'Requests UKHSA from the GOV.UK Organisations API and checks the name, abbreviation, type and homepage link');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const organisation = await response.json();
    expect(organisation.title).toBe('UK Health Security Agency');
    expect(organisation.format).toBe('Executive agency');
    expect(organisation.details.abbreviation).toBe('UKHSA');
    expect(organisation.details.slug).toBe(slug);
    expect(organisation.details.govuk_status).toBe('live');
    expect(organisation.web_url).toBe(new URL(homepage, baseURL).toString());
  });

  test('returns 404 for an organisation that does not exist', async ({ request }) => {
    const response = await get(request, '/api/organisations/this-organisation-does-not-exist-playwright',
      'Requests a made-up organisation from the Organisations API and checks it returns 404 Not Found');

    expect(response.status()).toBe(404);
  });
});

test.describe('Search API', () => {
  test('returns the latest UKHSA content as a JSON list', async ({ request }) => {
    const response = await get(request, `/api/search.json?filter_organisations=${slug}&count=5&fields=title,link`,
      'Searches GOV.UK for the 5 latest pages published by UKHSA and checks each result has a title and a link');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const search = await response.json();
    expect(search.total).toBeGreaterThan(0);
    expect(search.results).toHaveLength(5);
    for (const result of search.results) {
      expect(typeof result.title).toBe('string');
      expect(result.link).toMatch(/^\//);
    }
  });
});

test.describe('Homepage HTTP behaviour', () => {
  test('HTTP redirects to HTTPS', async ({ request, baseURL }) => {
    const httpUrl = new URL(homepage, baseURL).toString().replace(/^https:/, 'http:');
    const response = await get(request, httpUrl,
      'Requests the UKHSA homepage over insecure http:// and checks it permanently redirects (301) to the secure https:// address',
      { maxRedirects: 0 });

    expect(response.status()).toBe(301);
    expect(response.headers()['location']).toBe(new URL(homepage, baseURL).toString());
  });

  test('security headers are present', async ({ request }) => {
    const response = await get(request, homepage,
      'Requests the UKHSA homepage and checks the security headers are set: HSTS (forces HTTPS), X-Frame-Options (stops clickjacking), X-Content-Type-Options (stops content sniffing) and a Content Security Policy');
    const headers = response.headers();

    expect(response.status()).toBe(200);
    expect(headers['content-type']).toContain('text/html');
    expect(headers['strict-transport-security']).toMatch(/max-age=\d+/);
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['content-security-policy']).toContain("object-src 'none'");
  });

  test('homepage HTML has the expected title', async ({ request }) => {
    const response = await get(request, homepage,
      'Requests the UKHSA homepage and checks the HTML has the page title "UK Health Security Agency - GOV.UK"');

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<title>UK Health Security Agency - GOV.UK</title>');
  });
});

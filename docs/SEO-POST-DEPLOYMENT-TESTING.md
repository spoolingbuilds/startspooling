# SEO Post-Deployment Testing Checklist

After deploying SEO changes, run through this checklist to verify everything works.

## Pre-Deployment Local Testing

### 1. Metadata Validation
- [ ] View source of localhost:3000
- [ ] Verify title tag present and correct
- [ ] Verify meta description present
- [ ] Verify Open Graph tags present (og:title, og:description, og:image, og:url)
- [ ] Verify Twitter Card tags present
- [ ] Verify canonical tag present
- [ ] Verify robots meta tag correct on /verify and /welcome pages

### 2. File Generation
- [ ] Visit localhost:3000/sitemap.xml - should show XML
- [ ] Visit localhost:3000/robots.txt - should show text rules
- [ ] Verify sitemap includes only public pages
- [ ] Verify robots.txt blocks /verify, /welcome, /api

### 3. Structured Data
- [ ] View source and find JSON-LD scripts
- [ ] Copy JSON-LD to https://search.google.com/test/rich-results
- [ ] Verify no errors in Organization schema
- [ ] Verify no errors in WebSite schema

## Post-Deployment Testing

### 1. Live Site Metadata Check
Production URL: https://startspooling.com

- [ ] View source of live site
- [ ] Verify all meta tags present
- [ ] Check OG image URL works: https://startspooling.com/og-image.png
- [ ] Check Apple touch icon works: https://startspooling.com/apple-touch-icon.png

### 2. Sitemap Validation
- [ ] Visit https://startspooling.com/sitemap.xml
- [ ] Verify valid XML format
- [ ] Validate at: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- [ ] No broken URLs

### 3. Robots.txt Validation
- [ ] Visit https://startspooling.com/robots.txt
- [ ] Verify allows: /
- [ ] Verify disallows: /verify, /welcome, /api
- [ ] Verify sitemap reference present
- [ ] Test with Google's robots.txt Tester (in Search Console)

### 4. Mobile-Friendly Test
URL: https://search.google.com/test/mobile-friendly

- [ ] Enter https://startspooling.com
- [ ] Click "Test URL"
- [ ] Verify "Page is mobile-friendly"
- [ ] Screenshot looks correct
- [ ] No issues listed

### 5. Rich Results Test
URL: https://search.google.com/test/rich-results

- [ ] Enter https://startspooling.com
- [ ] Click "Test URL"
- [ ] Verify Organization schema detected
- [ ] Verify WebSite schema detected
- [ ] No errors or warnings
- [ ] Preview looks correct

### 6. PageSpeed Insights
URL: https://pagespeed.web.dev/

**Desktop Test:**
- [ ] Performance score >90
- [ ] Accessibility score >90
- [ ] Best Practices score >90
- [ ] SEO score = 100
- [ ] All Core Web Vitals green (LCP, FID/INP, CLS)

**Mobile Test:**
- [ ] Performance score >85
- [ ] Accessibility score >90
- [ ] Best Practices score >90
- [ ] SEO score = 100
- [ ] All Core Web Vitals green

### 7. Security Headers
URL: https://securityheaders.com/

- [ ] Enter https://startspooling.com
- [ ] Grade A or A+
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security present

### 8. SSL/HTTPS Check
URL: https://www.ssllabs.com/ssltest/

- [ ] Grade A or A+
- [ ] Certificate valid and not expired
- [ ] No security warnings
- [ ] HTTP redirects to HTTPS

### 9. Social Media Preview Testing

**Facebook Sharing Debugger:**
URL: https://developers.facebook.com/tools/debug/

- [ ] Enter https://startspooling.com
- [ ] Click "Debug"
- [ ] Verify OG image displays correctly
- [ ] Verify title and description correct
- [ ] No warnings

**Twitter Card Validator:**
URL: https://cards-dev.twitter.com/validator

- [ ] Enter https://startspooling.com
- [ ] Verify card type: summary_large_image
- [ ] Verify image displays
- [ ] Verify title and description correct

**LinkedIn Post Inspector:**
URL: https://www.linkedin.com/post-inspector/

- [ ] Enter https://startspooling.com
- [ ] Verify preview looks correct
- [ ] No errors

### 10. Accessibility Check

**WAVE Tool:**
URL: https://wave.webaim.org/

- [ ] Enter https://startspooling.com
- [ ] Verify no errors
- [ ] Address any warnings if critical
- [ ] Check contrast ratios

**Lighthouse Accessibility:**
- [ ] Open DevTools > Lighthouse
- [ ] Run Accessibility audit
- [ ] Score >90
- [ ] Address any flagged issues

## Google Search Console Setup

### 1. Verify Ownership
- [ ] Go to https://search.google.com/search-console
- [ ] Add property: https://startspooling.com
- [ ] Choose verification method (HTML file, DNS, or meta tag)
- [ ] Complete verification

### 2. Submit Sitemap
- [ ] In Search Console, go to Sitemaps
- [ ] Enter: sitemap.xml
- [ ] Click Submit
- [ ] Wait 24-48 hours for processing

### 3. Request Indexing
- [ ] In Search Console, go to URL Inspection
- [ ] Enter: https://startspooling.com
- [ ] Click "Request Indexing"
- [ ] Wait for confirmation

## Week 1 Monitoring

### Day 1 (Deploy Day)
- [ ] All pre-deployment tests pass
- [ ] No errors in production console
- [ ] Site loads correctly
- [ ] Forms work properly

### Day 3
- [ ] Check Search Console for crawl errors
- [ ] Check Coverage report
- [ ] Verify sitemap processed
- [ ] No security issues

### Day 7
- [ ] Check if homepage indexed (search: site:startspooling.com)
- [ ] Review Coverage report
- [ ] Check for any errors
- [ ] Monitor Core Web Vitals report

## Ongoing Monitoring (Weekly)

- [ ] Google Search Console Performance report
- [ ] Any new errors or warnings
- [ ] Core Web Vitals status
- [ ] Mobile usability issues
- [ ] Security issues

## Common Issues & Solutions

### Issue: Sitemap shows "Couldn't fetch"
**Solution:**
- Verify sitemap.xml accessible
- Check for syntax errors
- Wait 24 hours and resubmit

### Issue: Page not indexed after 2 weeks
**Solution:**
- Check robots.txt not blocking
- Verify no noindex tag
- Request indexing again
- Improve content quality

### Issue: Core Web Vitals failing
**Solution:**
- Run PageSpeed Insights
- Address specific opportunities
- Optimize images
- Reduce JavaScript

### Issue: OG image not showing
**Solution:**
- Verify image exists and is accessible
- Check dimensions (1200x630)
- Use Facebook Debugger to refresh
- Clear cache and retest

### Issue: Mobile-Friendly test fails
**Solution:**
- Fix viewport meta tag
- Remove horizontal scroll
- Increase tap target sizes
- Test on real device

## Success Criteria

After 1 week:
- [X] Homepage indexed in Google
- [X] No errors in Search Console
- [X] All Core Web Vitals green
- [X] Sitemap processed successfully
- [X] No security warnings

After 1 month:
- [X] Appearing for branded search "startspooling"
- [X] Some organic impressions in GSC
- [X] No critical SEO issues
- [X] Performance scores maintained

## Documentation Complete When:
- [X] All tests pass
- [X] No errors in Search Console
- [X] Site indexed properly
- [X] Performance scores meet targets
- [X] Social previews work correctly



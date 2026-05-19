export interface SeoData {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

export function applySeo(seo: SeoData): void {
  const canonicalUrl = `${window.location.origin}${seo.path}`;
  document.title = seo.title;
  setMeta('description', seo.description);
  setMeta('robots', seo.noindex ? 'noindex,follow' : 'index,follow');
  setLink('canonical', canonicalUrl);
  setProperty('og:title', seo.title);
  setProperty('og:description', seo.description);
  setProperty('og:type', 'website');
  setProperty('og:url', canonicalUrl);
  setProperty('og:image', `${window.location.origin}/ogp.svg`);
  setMeta('twitter:card', 'summary_large_image');
}

function setMeta(name: string, content: string): void {
  let node = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.name = name;
    document.head.appendChild(node);
  }
  node.content = content;
}

function setProperty(property: string, content: string): void {
  let node = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute('property', property);
    document.head.appendChild(node);
  }
  node.content = content;
}

function setLink(rel: string, href: string): void {
  let node = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.rel = rel;
    document.head.appendChild(node);
  }
  node.href = href;
}

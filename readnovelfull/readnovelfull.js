const mangayomiSources = [{
  "name": "ReadNovelFull",
  "lang": "en",
  "baseUrl": "https://readnovelfull.com",
  "apiUrl": "",
  "iconUrl": "https://readnovelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2,
  "version": "1.0.3",
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/readnovelfull.js",
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    const doc = new Document(res.body);
    const novels = [];
    const elements = doc.select("div.list-novel .row").toArray();

    for (const el of elements) {
      const titleEl = el.selectFirst("h3.novel-title > a");
      const imgEl = el.selectFirst("img");

      if (!titleEl || !imgEl) continue;

      const name = titleEl.getText().trim();
      const link = "https://readnovelfull.com" + titleEl.getHref();
      const imgSrc = imgEl.hasAttr("data-src") ? imgEl.getAttribute("data-src") : imgEl.getSrc();
      const imageUrl = imgSrc.startsWith("http") ? imgSrc : "https://readnovelfull.com" + imgSrc;

      novels.push({ name, link, imageUrl });
    }

    const hasNextPage = doc.selectFirst(".pagination > li.active + li") !== null;
    return { list: novels, hasNextPage };
  }

  async getPopular(page) {
    const res = await new Client().get(`https://readnovelfull.com/novel-list/most-popular-novel?page=${page}`);
    return this.mangaListFromPage(res);
  }

  async getLatestUpdates(page) {
    const res = await new Client().get(`https://readnovelfull.com/novel-list/latest-release-novel?page=${page}`);
    return this.mangaListFromPage(res);
  }

  async search(query, page, filters) {
    const res = await new Client().get(`https://readnovelfull.com/novel-list/search?keyword=${encodeURIComponent(query)}&page=${page}`);
    return this.mangaListFromPage(res);
  }

  async getDetail(url) {
    const client = new Client();
    const res = await client.get(url);
    const doc = new Document(res.body);

    const imageUrl = doc.selectFirst(".book img")?.getSrc();
    const description = doc.selectFirst(".desc-text")?.getText().trim();
    const author = doc.selectFirst("a[property='author']")?.getText().trim();
    const genre = doc.select("a[itemprop='genre']").toArray().map(el => el.getText().trim());
    const statusText = doc.selectFirst(".info > div")?.getText().toLowerCase();
    const status = statusText?.includes("ongoing") ? 0 : statusText?.includes("completed") ? 1 : 2;

    const chapters = [];
    const chapterElements = doc.select("#tab-chapters .list-chapter > li > a").toArray().reverse();
    for (const el of chapterElements) {
      const name = el.getText().trim();
      const link = "https://readnovelfull.com" + el.getHref();
      chapters.push({
        name,
        url: link,
        dateUpload: null,
        scanlator: null
      });
    }

    return {
      imageUrl,
      description,
      genre,
      author,
      artist: "",
      status,
      chapters
    };
  }

  async getHtmlContent(name, url) {
    const res = await new Client().get(url);
    return this.cleanHtmlContent(res.body);
  }

  async cleanHtmlContent(html) {
    const doc = new Document(html);
    const title = doc.selectFirst("h2")?.getText().trim() || "";
    const content = doc.selectFirst(".chapter-c")?.getInnerHtml();
    return `<h2>${title}</h2><hr><br>${content}`;
  }

  getFilterList() {
    return [];
  }

  getSourcePreferences() {
    return {};
  }
}
export default class Novelfull {
  constructor() {
    this.name = "Novelfull";
    this.lang = "en";
    this.id = "novelfull";
    this.baseUrl = "https://novelfull.com";
  }

  async fetchPopularNovels(page) {
    const url = `${this.baseUrl}/most-popular?page=${page}`;
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const novels = [];
    doc.querySelectorAll(".list-truyen .row").forEach(el => {
      const title = el.querySelector("h3.truyen-title > a")?.textContent?.trim();
      const cover = el.querySelector("img")?.getAttribute("src");
      const novelUrl = el.querySelector("h3.truyen-title > a")?.getAttribute("href");

      if (title && novelUrl) {
        novels.push({
          title,
          cover: cover?.startsWith("http") ? cover : `https://novelfull.com${cover}`,
          url: `https://novelfull.com${novelUrl}`,
        });
      }
    });

    return novels;
  }

  async parseChapter(chapterUrl) {
    const response = await fetch(chapterUrl);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const content = doc.querySelector(".chapter-c")?.innerHTML;
    return {
      content
    };
  }
}

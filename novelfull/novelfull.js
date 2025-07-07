const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2,
  "version": "1.0.7", // PENTING: Tingkatkan versi untuk memaksa muat semula di Mangayomi
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js", // Sahkan laluan ini
  "isNsfw": false,
  "hasCloudflare": true // Kekalkan ini agar Mangayomi mengendalikan Cloudflare
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    const doc = new Document(res.body);
    const novels = [];
    const elements = doc.select(".list-truyen .row"); // Kekalkan selector asas ini

    console.log("mangaListFromPage: Found elements count:", elements.length); // Debugging

    for (const el of elements) {
      // Dapatkan Nama dan Pautan
      const nameEl = el.selectFirst("h3.truyen-title > a");
      let name = nameEl?.text?.trim() || "";
      let link = nameEl?.getHref() || ""; // PENTING: Panggil getHref() sebagai fungsi

      // Dapatkan URL Imej (Poster)
      const imageEl = el.selectFirst("img");
      let imageUrl = imageEl?.getSrc() || ""; // PENTING: Panggil getSrc() sebagai fungsi

      // Periksa jika URL imej adalah relatif dan jadikan ia mutlak
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = "https://novelfull.com" + imageUrl;
      }
      
      // Console log untuk debugging item yang diparse
      console.log(`Parsed Item: Name='${name}', Link='${link}', ImageURL='${imageUrl}'`);

      if (name && link) {
        novels.push({ name, link: "https://novelfull.com" + link, imageUrl });
      }
    }
    const hasNextPage = doc.selectFirst("ul.pagination > li.active + li") !== null;
    console.log("mangaListFromPage: Has next page:", hasNextPage); // Debugging
    return { list: novels, hasNextPage };
  }

  async getPopular(page) {
    const res = await new Client().get(`https://novelfull.com/most-popular?page=${page}`, {
      headers: { // Tambah headers untuk meniru pelayar web
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://novelfull.com",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    // Tiada Cloudflare check eksplisit di sini, bergantung pada hasCloudflare: true
    return this.mangaListFromPage(res);
  }

  async getLatestUpdates(page) {
    const res = await new Client().get(`https://novelfull.com/latest-release?page=${page}`, {
      headers: { // Tambah headers
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://novelfull.com",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    return this.mangaListFromPage(res);
  }

  async search(query, page, filters) {
    const res = await new Client().get(`https://novelfull.com/search?keyword=${encodeURIComponent(query)}&page=${page}`, {
      headers: { // Tambah headers
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://novelfull.com",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    return this.mangaListFromPage(res);
  }

  async getDetail(url) {
    const client = new Client();
    const res = await client.get(url, {
      headers: { // Tambah headers
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": url, // Referer boleh jadi URL novel itu sendiri untuk detail
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    const doc = new Document(res.body);

    // Dapatkan URL Imej (Poster Detail)
    const imageUrl = doc.selectFirst(".book img")?.getSrc(); // PENTING: Panggil getSrc() sebagai fungsi
    // Periksa jika URL imej adalah relatif dan jadikan ia mutlak
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = "https://novelfull.com" + imageUrl;
    }

    const description = doc.selectFirst(".desc-text")?.text.trim();
    const author = doc.selectFirst("a[property='author']")?.text.trim();
    const genre = doc.select("a[itemprop='genre']").map((el) => el.text.trim());
    const statusText = doc.selectFirst(".info > div")?.text.toLowerCase();
    const status = statusText?.includes("ongoing") ? 0 : statusText?.includes("completed") ? 1 : 2;

    const chapters = [];
    const chapterDoc = new Document(res.body); // Boleh guna `doc` terus
    const chapterElements = chapterDoc.select(".list-chapter > li");
    for (const el of chapterElements) {
      const name = el.selectFirst("a")?.text.trim();
      const link = el.selectFirst("a")?.getHref(); // PENTING: Panggil getHref() sebagai fungsi
      chapters.push({
        name,
        url: "https://novelfull.com" + link,
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
    const res = await new Client().get(url, {
      headers: { // Tambah headers
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": url,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    return this.cleanHtmlContent(res.body);
  }

  async cleanHtmlContent(html) {
    const doc = new Document(html);
    const title = doc.selectFirst("h2")?.text.trim() || "";
    const content = doc.selectFirst(".chapter-c")?.innerHtml;
    return `<h2>${title}</h2><hr><br>${content}`;
  }

  getFilterList() {
    return [];
  }

  getSourcePreferences() {
    return {};
  }
}

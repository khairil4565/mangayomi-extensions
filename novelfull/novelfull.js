const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.8", // PENTING: Tingkatkan versi!
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js", // Sahkan laluan ini
  "isNsfw": false,
  "hasCloudflare": true // Kekalkan ini
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    console.log("--- DEBUG: mangaListFromPage Called (Version 1.0.8) ---");
    console.log("HTTP Response Status:", res.status);
    console.log("Response Body Length:", res.body.length);
    console.log("First 1000 characters of Response Body:");
    console.log(res.body.substring(0, 1000)); // Log 1000 karakter pertama

    // Periksa halaman Cloudflare di sini juga
    if (res.body.includes("Just a moment") || res.body.includes("Enable JavaScript and cookies to continue")) {
      console.error("Cloudflare challenge detected in mangaListFromPage!");
      return { list: [], hasNextPage: false }; // Kembali kosong jika Cloudflare
    }

    const doc = new Document(res.body);
    const novels = [];

    // Guna selector yang lebih robust dan umum
    // Kita akan cuba selector yang biasa digunakan untuk novel/manga list items
    let elements = doc.select(".list-truyen .row, .novel-list .item, .col-truyen-main .row, .novel-grid .novel-item"); 
    
    console.log("Found initial novel elements (any selector):", elements.length);

    // Jika tiada elemen ditemui dengan selector di atas, logkan
    if (elements.length === 0) {
        console.warn("No main novel list elements found with common selectors. HTML might have changed.");
        // Anda boleh tambah selector lain di sini jika tahu
    }

    for (const el of elements) {
      let name = "";
      let link = "";
      let imageUrl = "";

      // Cuba selector nama/link yang paling mungkin
      // Pastikan nameEl wujud sebelum cuba dapatkan text atau href
      const nameEl = el.selectFirst("h3.truyen-title > a, .novel-title a, .title a, a.text-filter");
      if (nameEl) {
        name = nameEl.text?.trim() || "";
        // Cara lebih selamat untuk memanggil getHref
        if (typeof nameEl.getHref === 'function') {
            link = nameEl.getHref() || "";
        } else {
            // Jika getHref bukan fungsi, ia mungkin properti
            link = nameEl.getHref || ""; 
            console.warn("nameEl.getHref is not a function, using as property:", name, link);
        }
      }

      // Cuba selector imej yang paling mungkin
      // Pastikan imageEl wujud sebelum cuba dapatkan src
      const imageEl = el.selectFirst("img, .cover img, .novel-cover img");
      if (imageEl) {
        // Cara lebih selamat untuk memanggil getSrc
        if (typeof imageEl.getSrc === 'function') {
            imageUrl = imageEl.getSrc() || "";
        } else {
            // Jika getSrc bukan fungsi, ia mungkin properti atau data-src
            imageUrl = imageEl.getSrc || imageEl.getAttribute("data-src") || imageEl.getAttribute("srcset") || "";
            console.warn("imageEl.getSrc is not a function, using as property/attribute:", name, imageUrl);
        }
      }

      // Periksa jika URL imej adalah relatif dan jadikan ia mutlak
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `${this.source.baseUrl}${imageUrl}`;
      }
      
      // Pastikan link adalah URL penuh
      const fullLink = link.startsWith("http") ? link : `${this.source.baseUrl}${link}`;

      console.log(`Parsed Item: Name='${name}', Link='${fullLink}', ImageURL='${imageUrl}'`);

      if (name && link) { // Hanya tambah jika ada nama dan link
        novels.push({ name, link: fullLink, imageUrl });
      } else {
          console.warn("Skipping item due to missing name or link:", el.outerHtml);
      }
    }
    
    // Selector untuk next page
    const hasNextPage = doc.selectFirst("ul.pagination > li.active + li, .pagination .next, .next-page") !== null;
    console.log("Has next page:", hasNextPage);
    console.log("Total novels found:", novels.length);
    console.log("--- End mangaListFromPage Debug ---");
    return { list: novels, hasNextPage };
  }

  // toStatus, getPopular, getLatestUpdates, search, getDetail, getHtmlContent, cleanHtmlContent, getFilterList, getSourcePreferences, parseDate
  // Kekalkan fungsi-fungsi ini seperti dalam kod versi 1.0.7 yang saya berikan sebelumnya.
  // Pastikan anda menambah 'headers' pada setiap panggilan Client().get()
  // dan juga letakkan Cloudflare check dalam fungsi-fungsi async ini.
  // Saya tidak akan sertakan kesemuanya di sini untuk menjimatkan ruang,
  // tetapi sila pastikan anda menyalinnya dari versi 1.0.7.

  // Contoh untuk getPopular (lain-lain fungsi async HTTP serupa)
  async getPopular(page) {
    console.log("--- DEBUG: getPopular Called (Version 1.0.8) ---");
    try {
        const url = `${this.source.baseUrl}/most-popular?page=${page}`;
        console.log("Requesting URL:", url);
        const res = await new Client().get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        console.log("HTTP Status:", res.status);
        // Penting: Cloudflare check di sini juga
        if (res.body.includes("Just a moment") || res.body.includes("Enable JavaScript and cookies to continue")) {
            console.error("Cloudflare challenge detected in getPopular!");
            return { list: [], hasNextPage: false }; 
        }
        return this.mangaListFromPage(res);
    } catch (error) {
        console.error("getPopular: Error during HTTP request:", error);
        return { list: [], hasNextPage: false };
    }
  }

  // ... (fungsi-fungsi lain seperti getLatestUpdates, search, getDetail, getHtmlContent, cleanHtmlContent, toStatus, getFilterList, getSourcePreferences, parseDate)
  // Pastikan kesemuanya ada dalam kod penuh anda dan disesuaikan dengan logging dan headers.

  // Contoh getDetail - perlukan semakan getSrc() dan getHref() juga
  async getDetail(url) {
    console.log("--- DEBUG: getDetail Called (Version 1.0.8) ---");
    try {
        const client = new Client();
        const res = await client.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": url,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        console.log("HTTP Status:", res.status);
        if (res.body.includes("Just a moment") || res.body.includes("Enable JavaScript and cookies to continue")) {
            console.error("Cloudflare challenge detected in getDetail!");
            return {
                imageUrl: "", description: "", genre: [], author: "", artist: "", status: 2, chapters: []
            };
        }
        const doc = new Document(res.body);

        let imageUrl = "";
        const imageEl = doc.selectFirst(".book img, .novel-cover img, .cover-image img, .info img");
        if (imageEl) {
            if (typeof imageEl.getSrc === 'function') {
                imageUrl = imageEl.getSrc() || "";
            } else {
                imageUrl = imageEl.getSrc || imageEl.getAttribute("data-src") || imageEl.getAttribute("srcset") || "";
                console.warn("imageEl.getSrc in getDetail is not a function, using as property/attribute:", imageUrl);
            }
        }
        if (imageUrl && imageUrl.startsWith("/")) {
            imageUrl = `${this.source.baseUrl}${imageUrl}`;
        }
        console.log("getDetail: imageUrl:", imageUrl);

        const description = doc.selectFirst(".desc-text, .desc, .novel-description")?.text?.trim() || "";
        const author = doc.selectFirst("a[property='author'], .author a, .info a")?.text?.trim() || "";
        const artist = ""; 
        
        const statusText = doc.selectFirst(".info > div, .status, .info-meta")?.text?.toLowerCase() || "";
        const status = this.toStatus(statusText);
        
        const genre = doc.select("a[itemprop='genre'], .genre a, .category a").map((el) => el.text?.trim()).filter(g => g);

        const chapters = [];
        const chapterElements = doc.select(".list-chapter > li, .chapter-list li");
        console.log("Found chapters:", chapterElements.length);
        for (const el of chapterElements) {
            const nameEl = el.selectFirst("a");
            let name = "";
            let link = "";
            if (nameEl) {
                name = nameEl.text?.trim() || "";
                if (typeof nameEl.getHref === 'function') {
                    link = nameEl.getHref() || "";
                } else {
                    link = nameEl.getHref || "";
                    console.warn("nameEl.getHref in chapters is not a function, using as property:", name, link);
                }
            }
            if (name && link) {
                chapters.push({
                    name,
                    url: `${this.source.baseUrl}${link}`,
                    dateUpload: null,
                    scanlator: null
                });
            }
        }
        return {
            imageUrl, description, genre, author, artist, status, chapters
        };
    } catch (error) {
        console.error("getDetail: Error:", error);
        return {
            imageUrl: "", description: "", genre: [], author: "", artist: "", status: 2, chapters: []
        };
    }
  }

  // ... (fungsi-fungsi lain)
}

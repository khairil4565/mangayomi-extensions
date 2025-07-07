const client = new Client();

class AllNovelFullSource {
    constructor() {
        this.name = "AllNovelFull";
        this.baseUrl = "https://allnovelfull.com";
        this.lang = "en";
        this.id = "allnovelfull";
        this.version = 1;
    }

    // Fetch list of novels (e.g., popular or latest)
    async getNovels(page = 1) {
        const url = `${this.baseUrl}/most-popular?page=${page}`;
        const res = await client.get(url);
        const document = new Document(res.body);
        
        const novels = [];
        const items = document.select(".list-novel .novel-item"); // Adjust selector based on actual HTML
        for (const item of items) {
            const title = item.selectFirst(".novel-title").text;
            const url = item.selectFirst("a").attr("href");
            const cover = item.selectFirst("img").attr("src");
            novels.push({
                title: title,
                url: `${this.baseUrl}${url}`,
                cover: cover.startsWith("http") ? cover : `${this.baseUrl}${cover}`
            });
        }
        return novels;
    }

    // Fetch novel details
    async getNovelDetails(novelUrl) {
        const res = await client.get(novelUrl);
        const document = new Document(res.body);

        const title = document.selectFirst(".novel-title").text;
        const cover = document.selectFirst(".novel-cover img").attr("src");
        const author = document.selectFirst(".author").text;
        const description = document.selectFirst(".description").text;
        const genres = document.select(".genres a").map(genre => genre.text).join(", ");
        const status = document.selectFirst(".status").text;

        return {
            title: title,
            cover: cover.startsWith("http") ? cover : `${this.baseUrl}${cover}`,
            author: author,
            description: description,
            genres: genres,
            status: status
        };
    }

    // Fetch chapter list
    async getChapterList(novelUrl) {
        const res = await client.get(novelUrl);
        const document = new Document(res.body);

        const chapters = [];
        const chapterItems = document.select(".chapter-list a"); // Adjust selector
        for (const item of chapterItems) {
            const title = item.text;
            const url = item.attr("href");
            const dateUpload = item.selectFirst(".chapter-date").text || null; // Adjust selector or leave null
            chapters.push({
                title: title,
                url: `${this.baseUrl}${url}`,
                dateUpload: dateUpload
            });
        }
        return chapters.reverse(); // Reverse to display chapters in ascending order
    }

    // Fetch chapter content
    async getChapterContent(chapterUrl) {
        const res = await client.get(chapterUrl);
        const document = new Document(res.body);

        const content = document.selectFirst(".chapter-content").text; // Adjust selector
        return content;
    }

    // Search novels
    async searchNovels(query, page = 1) {
        const url = `${this.baseUrl}/search?keyword=${encodeURIComponent(query)}&page=${page}`;
        const res = await client.get(url);
        const document = new Document(res.body);

        const novels = [];
        const items = document.select(".list-novel .novel-item"); // Adjust selector
        for (const item of items) {
            const title = item.selectFirst(".novel-title").text;
            const url = item.selectFirst("a").attr("href");
            const cover = item.selectFirst("img").attr("src");
            novels.push({
                title: title,
                url: `${this.baseUrl}${url}`,
                cover: cover.startsWith("http") ? cover : `${this.baseUrl}${cover}`
            });
        }
        return novels;
    }
}

module.exports = new AllNovelFullSource();

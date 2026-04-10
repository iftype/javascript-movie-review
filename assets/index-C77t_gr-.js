(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const URL = {
  BASE: "https://api.themoviedb.org/3",
  THUMBNAIL_IMAGE: "https://image.tmdb.org/t/p/w500",
  ORIGINAL_IMAGE: "https://image.tmdb.org/t/p/original"
};
const PATH = {
  MOVIE_POPULAR: "/movie/popular",
  SEARCH_MOVIE: "/search/movie",
  MOVIE_DETAIL: (movie_id) => `/movie/${movie_id}`
};
const getOriginalImageUrl = (src) => {
  return URL.ORIGINAL_IMAGE + src;
};
const getThumbnailImageUrl = (src) => {
  return URL.THUMBNAIL_IMAGE + src;
};
const $ = (el, selector) => {
  const found = el.querySelector(selector);
  if (!found) throw new Error(`${selector} 없음`);
  return found;
};
const Star = (filled) => {
  const $img = document.createElement("img");
  $img.className = "star";
  $img.src = filled ? "./images/star_filled.png" : "./images/star_empty.png";
  $img.alt = filled ? "star_filled" : "star_empty";
  return $img;
};
const POINTS = ["최악이예요", "별로예요", "보통이에요", "재미있어요", "명작이에요"];
class SubmitRate {
  #$submiteRateContainer;
  #$starContanier;
  #$rateText;
  #onSubmitRate;
  constructor(rate, onSubmitRate) {
    this.#onSubmitRate = onSubmitRate;
    this.#$submiteRateContainer = document.createElement("div");
    this.#$submiteRateContainer.className = "submit-rate-container";
    this.#$starContanier = document.createElement("div");
    this.#$starContanier.className = "star-container";
    const $rateTextContainer = document.createElement("div");
    this.#$rateText = document.createElement("p");
    $rateTextContainer.append(this.#$rateText);
    this.#$submiteRateContainer.append(this.#$starContanier);
    this.#$submiteRateContainer.append($rateTextContainer);
    this.#renderStar(rate);
  }
  get $element() {
    return this.#$submiteRateContainer;
  }
  #renderStar = (rate = 0) => {
    this.#$starContanier.innerHTML = "";
    const rateText = rate !== 0 ? `${POINTS[rate / 2 - 1]} ${rate}/10` : "별점을 입력해주세요";
    this.#$rateText.textContent = rateText;
    POINTS.forEach((point, index) => {
      const score = (index + 1) * 2;
      const $button = document.createElement("button");
      $button.className = "submit-star-button";
      $button.append(Star(score <= rate));
      $button.addEventListener("click", () => {
        this.#$rateText.textContent = point;
        this.#onSubmitRate(score);
        this.#renderStar(score);
      });
      this.#$starContanier.append($button);
    });
  };
}
class Modal {
  #movieRepo;
  #$modal;
  #$body;
  constructor(movieRepo, $body) {
    this.#movieRepo = movieRepo;
    this.#$body = $body;
    this.#$modal = document.createElement("div");
    this.#$modal.id = "modalBackground";
    this.#$modal.className = "modal-background";
    this.#$modal.innerHTML = /*html */
    `
      <div class="modal">
        <button class="close-modal" id="closeModal">
          <img src="./images/modal_button_close.png" />
        </button>
        <div class="modal-container">
          <div class="modal-image"><img /></div>
          <div class="modal-description">
            <h2></h2>
            <p class="category"></p>
            <div class="rate"></div>
            <hr />
            <div class="modal-submit-star">
              <h3>내 별점</h3>
            </div>
            <hr />
            <div>
              <h3>줄거리</h3>
              <p class="detail"></p>
            </div>
          </div>
        </div>
      </div>
    `;
    $(this.#$modal, "button").addEventListener("click", () => this.close());
  }
  get $element() {
    return this.#$modal;
  }
  #update(movie) {
    const { title, release_date, overview, poster_path, genres, vote_average } = movie;
    $(this.#$modal, ".modal-image img").src = getOriginalImageUrl(poster_path);
    $(this.#$modal, "h2").textContent = title;
    $(this.#$modal, ".detail").textContent = overview;
    const releaseYear = new Date(release_date).getFullYear();
    const category = genres.map((g) => g.name).join(" ");
    $(this.#$modal, ".category").textContent = `${releaseYear} · ${category}`;
    const $rateContainer = $(this.#$modal, ".rate");
    $rateContainer.innerHTML = "";
    const $starIcon = Star(true);
    const $score = document.createElement("span");
    $score.textContent = `평균 ${Number(vote_average).toFixed(1)}`;
    $rateContainer.append($starIcon, $score);
  }
  open(movie) {
    this.#$body.className = "modal-open";
    this.#$modal.classList.add("active");
    this.#update(movie);
    const { id } = movie;
    const movieRate = Number(this.#movieRepo.getRate(`${id}`)) || 0;
    const $submitRate = new SubmitRate(movieRate, (rate) => {
      this.#movieRepo.saveRate(`${id}`, String(rate));
    }).$element;
    const $container = $(this.#$modal, ".modal-submit-star");
    const $oldCon = $container.querySelector(".submit-rate-container");
    if ($oldCon) $oldCon.remove();
    $container.append($submitRate);
  }
  close() {
    console.log("object");
    this.#$body.classList.remove("modal-open");
    this.#$modal.classList.remove("active");
  }
}
const Logo = () => {
  const tempalte = `
    <a href="#/">
      <img src="./images/logo.png" alt="MovieList" />
    </a>
  `;
  const $h1 = document.createElement("h1");
  $h1.className = "logo";
  $h1.innerHTML = tempalte;
  return $h1;
};
const Overlay = () => {
  const $overlay = document.createElement("div");
  $overlay.className = "overlay";
  $overlay.ariaHidden = "true";
  return $overlay;
};
const SearchForm = (onSubmit) => {
  const $form = document.createElement("form");
  $form.className = "search-form";
  $form.innerHTML = `
    <div class="search-wrap">
      <label for="search-input"></label>
      <input id="search-input" name="q" placeholder="검색어를 입력하세요" />
      <button class="search-button" type="submit">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" stroke="#aaa" stroke-width="2" fill="none"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#aaa" stroke-width="2"/>
        </svg>
      </button>
    </div>
  `;
  $form.addEventListener("submit", (e) => {
    e.preventDefault();
    const $input = $($form, "#search-input");
    const query = $input.value;
    onSubmit(query);
    $input.value = "";
  });
  return $form;
};
const TopRate = (data) => {
  const $container = document.createElement("div");
  $container.className = "top-rated-movie";
  $container.innerHTML = `
    <div class="rate">
      <span class="rate-value">${data.vote_average.toFixed(1)}</span>
    </div>
    <div class="title"></div>
    <button class="primary detail">자세히 보기</button>
  `;
  $($container, ".rate").prepend(Star());
  $($container, ".title").textContent = data.title;
  return $container;
};
class TopRateHeader {
  #$element;
  constructor(onSubmit) {
    this.#$element = document.createElement("header");
    this.#$element.innerHTML = `
      <div class="background-container top-header-container">
        <div class="top-rated-container"></div>
      </div>
    `;
    const $justLayout = document.createElement("div");
    $(this.#$element, ".top-rated-container").append(Logo(), SearchForm(onSubmit), $justLayout);
    $(this.#$element, ".background-container").prepend(Overlay());
  }
  get $element() {
    return this.#$element;
  }
  render(data) {
    $(this.#$element, ".background-container").style.backgroundImage = `url(${getOriginalImageUrl(data.backdrop_path)})`;
    $(this.#$element, ".top-rated-container").append(TopRate(data));
  }
}
const Error$1 = (message = "에러가 났습니다") => {
  const $div = document.createElement("div");
  $div.className = "nothing";
  $div.innerHTML = `
    <img src="./images/empty.png" alt="nothing" />
    <p> ${message}</p>
  `;
  return $div;
};
const MovieItem = (data) => {
  const { id, title, poster_path, vote_average } = data;
  const $li = document.createElement("li");
  $li.dataset.id = String(id);
  $li.innerHTML = `
    <div class="item">
      <img class="thumbnail" alt="" />
      <div class="item-desc">
        <p class="rate">
          <span></span>
        </p>
        <strong></strong>
      </div>
    </div>
  `;
  const $img = $($li, ".thumbnail");
  $img.src = getThumbnailImageUrl(poster_path);
  $img.onerror = () => {
    $img.src = "./images/empty.png";
  };
  $($li, ".item-desc strong").textContent = title;
  $($li, ".rate span").textContent = vote_average.toFixed(1);
  $($li, ".rate").prepend(Star());
  return $li;
};
const MovieItemSkeleton = () => {
  const $li = document.createElement("li");
  $li.innerHTML = `
    <div class="item skeleton">
      <div class="thumbnail"></div> <div class="item-desc">
        <div class="rate"></div>
        <div class="title"></div>
      </div>
    </div>
  `;
  return $li;
};
const NothingResult = () => {
  const $div = document.createElement("div");
  $div.className = "nothing";
  $div.innerHTML = `
    <img src="./images/empty.png" alt="nothing" />
    <p>검색 결과가 없습니다.</p>
  `;
  return $div;
};
class Main {
  #$element;
  #$list;
  #$skeletons;
  constructor(title, onDetail) {
    this.#$skeletons = /* @__PURE__ */ new Map();
    this.#$element = document.createElement("div");
    this.#$element.className = "container";
    this.#$element.innerHTML = `
      <main>
        <section>
          <h2>${title}</h2>
          <ul class="thumbnail-list"></ul>
        </section>
      </main>
    `;
    this.#$list = $(this.#$element, ".thumbnail-list");
    const $ul = $(this.#$element, "ul");
    $ul.addEventListener("click", (e) => {
      const $li = e.target.closest("li");
      const id = $li?.dataset.id;
      onDetail(Number(id));
    });
  }
  get $element() {
    return this.#$element;
  }
  renderMovies(movies, page) {
    this.removeSkeletons(page);
    const $fragment = new DocumentFragment();
    movies.forEach((movie) => $fragment.append(MovieItem(movie)));
    this.#$list.append($fragment);
  }
  renderSkeletons(page, length = 20) {
    if (this.#$skeletons.has(String(page))) {
      this.removeSkeletons(page);
    }
    const $newSkeletons = Array.from({ length }, () => MovieItemSkeleton());
    $newSkeletons.forEach(($skeleton) => this.#$list.append($skeleton));
    this.#$skeletons.set(String(page), $newSkeletons);
  }
  removeSkeletons(page) {
    if (!this.#$skeletons.has(String(page))) {
      return;
    }
    const $skeletonList = this.#$skeletons.get(String(page));
    $skeletonList?.forEach(($skeleton) => $skeleton.remove());
  }
  renderError(messsage) {
    const $element = $(this.#$element, "section");
    $element.innerHTML = "";
    $element.append(Error$1(messsage));
  }
  renderNothing() {
    const $element = $(this.#$element, "section");
    const $h2 = $(this.#$element, "h2");
    $element.innerHTML = "";
    $element.append($h2, NothingResult());
  }
}
class Footer {
  #$element;
  constructor() {
    this.#$element = document.createElement("footer");
    this.#$element.className = "footer";
    this.#$element.innerHTML = `
      <p>&copy; 우아한테크코스 All Rights Reserved.</p>
      <p><img src="./images/woowacourse_logo.png" width="180" /></p>
    `;
  }
  get $element() {
    return this.#$element;
  }
}
class TMDBError extends Error {
  code;
  success;
  constructor({ status_code, status_message, success }) {
    super(status_message);
    this.code = status_code;
    this.success = success;
  }
}
const API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwN2FhNDEzMTFjYjBjYmVkYmFmZTFiZjI1ZjdhMjhlMyIsIm5iZiI6MTc3NDg1NTE3OC45OTUwMDAxLCJzdWIiOiI2OWNhMjQwYTVhYzgwNDIyMzk4YWE3MzIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0xVetrHAobzs4CBOIbw98YQ0VyLSwCBZKRVQYj59lI8";
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`
  }
};
const fetchAPI = async (req) => {
  const url = URL.BASE + req.path;
  const { query, page } = req.params;
  const params = new URLSearchParams({ language: "ko-KR", region: "kr" });
  if (query) params.set("query", query);
  if (page) params.set("page", String(page));
  const resultUrl = url + "?" + params.toString();
  console.log(resultUrl);
  const response = await fetch(resultUrl, options);
  const data = await response.json();
  if (!response.ok) {
    throw new TMDBError(data);
  }
  return data;
};
const fetchSearchMovies = (query, page = 1) => {
  return fetchAPI({
    path: PATH.SEARCH_MOVIE,
    params: { query, page }
  });
};
const fetchPopularMovies = (page = 1) => {
  return fetchAPI({
    path: PATH.MOVIE_POPULAR,
    params: { page }
  });
};
const fetchMovieDetails = (movie_id) => {
  return fetchAPI({
    path: PATH.MOVIE_DETAIL(movie_id),
    params: {}
  });
};
const CUSTOM_EVENT = {
  ROUTE_CHANGE: "ROUTE_CHANGE",
  SCROOL_END: "SCROOL_END"
};
const dispatchRouteChange = (url) => {
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT.ROUTE_CHANGE, { detail: { url } }));
};
const throttle = {
  delay: 300,
  timer: null
};
const scrollEvent = () => {
  if (throttle.timer) return;
  throttle.timer = setTimeout(() => {
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT.SCROOL_END));
    throttle.timer = null;
  }, throttle.delay);
};
class HomePage {
  #$div;
  #page;
  #totalPage;
  #header;
  #main;
  #footer;
  #$modal;
  #isLoading;
  constructor(modal) {
    this.#$modal = modal;
    this.#isLoading = false;
    this.#totalPage = 1;
    this.#page = 1;
    this.#$div = document.createElement("div");
    this.#$div.id = "homepage";
    this.#header = new TopRateHeader(this.#onSubmit);
    this.#main = new Main("지금 인기있는 영화", this.#onDetail);
    this.#footer = new Footer();
    this.#$div.append(this.#header.$element, this.#main.$element, this.#footer.$element);
    window.addEventListener(CUSTOM_EVENT.SCROOL_END, () => {
      const isPage = window.document.querySelector("#homepage");
      if (isPage) this.#loadMore();
    });
    this.#initialFetch();
  }
  get $element() {
    return this.#$div;
  }
  async #initialFetch() {
    try {
      const response = await this.#appendMovies();
      if (response) {
        this.#header.render(response.results[0]);
      }
    } catch (error) {
      this.#handleError(error);
    }
  }
  async #loadMore() {
    if (this.#isLoading) return;
    this.#page += 1;
    this.#isLoading = true;
    await this.#appendMovies();
    this.#isLoading = false;
  }
  async #appendMovies() {
    this.#main.renderSkeletons(this.#page);
    try {
      if (this.#page > this.#totalPage) return;
      const response = await fetchPopularMovies(this.#page);
      this.#totalPage = response.total_pages;
      this.#main.renderMovies(response.results, this.#page);
      return response;
    } catch (error) {
      this.#handleError(error);
      throw error;
    } finally {
      this.#main.removeSkeletons(this.#page);
    }
  }
  #handleError(error) {
    if (error instanceof TMDBError) {
      this.#main.renderError(`TMDB 에러: ${error.message}`);
      return;
    }
    if (error instanceof Error) {
      this.#main.renderError(`시스템 에러: ${error.message}`);
      return;
    }
    this.#main.renderError("알 수 없는 에러가 발생했습니다.");
  }
  #onSubmit = (query) => {
    if (query.trim()) {
      dispatchRouteChange(`/search?query=${encodeURIComponent(query)}`);
    }
  };
  #onDetail = async (movie_id) => {
    try {
      console.log(this.#$modal);
      const movie = await fetchMovieDetails(movie_id);
      this.#$modal.open(movie);
    } catch (e) {
      console.log(e);
    }
  };
}
class SearchHeader {
  #$element;
  constructor(onSubmit) {
    this.#$element = document.createElement("header");
    this.#$element.innerHTML = `
      <div class="background-container">
        <div class="search-container"></div>
      </div>
    `;
    const $justLayout = document.createElement("div");
    $(this.#$element, ".search-container").append(Logo(), SearchForm(onSubmit), $justLayout);
  }
  get $element() {
    return this.#$element;
  }
}
class SearchPage {
  #$div;
  #page;
  #totalPage;
  #main;
  #$modal;
  #isLoading;
  constructor(modal) {
    this.#page = 1;
    this.#totalPage = 1;
    this.#$modal = modal;
    this.#isLoading = false;
    const query = this.#getQuery();
    this.#$div = document.createElement("div");
    this.#$div.id = "query";
    const header = new SearchHeader(this.#onSubmit);
    this.#main = new Main(`"${query}" 검색 결과`, this.#onDetail);
    const footer = new Footer();
    this.#$div.append(header.$element, this.#main.$element, footer.$element);
    window.addEventListener(CUSTOM_EVENT.SCROOL_END, () => {
      const isPage = window.document.querySelector(`#${query}`);
      if (isPage) this.#loadMore();
    });
    this.#initialFetch();
  }
  get $element() {
    return this.#$div;
  }
  #getQuery() {
    const [, queryString = ""] = window.location.hash.split("?");
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get("query") ?? "";
  }
  async #initialFetch() {
    try {
      await this.#appendMovies();
    } catch (error) {
      console.error("Search fetch failed:", error);
    }
  }
  async #loadMore() {
    if (this.#isLoading) return;
    this.#page += 1;
    this.#isLoading = true;
    await this.#appendMovies();
    this.#isLoading = false;
  }
  async #appendMovies() {
    this.#main.renderSkeletons(this.#page);
    try {
      if (this.#page > this.#totalPage) return;
      const response = await fetchSearchMovies(this.#getQuery(), this.#page);
      this.#totalPage = response.total_pages;
      if (response.results.length === 0) {
        this.#main.renderNothing();
        return response;
      }
      this.#main.renderMovies(response.results, this.#page);
      return response;
    } catch (error) {
      this.#handleError(error);
      throw error;
    } finally {
      this.#main.removeSkeletons(this.#page);
    }
  }
  #handleError(error) {
    if (error instanceof TMDBError) {
      this.#main.renderError(`TMDB 에러: ${error.message}`);
      return;
    }
    if (error instanceof Error) {
      this.#main.renderError(`시스템 에러: ${error.message}`);
      return;
    }
    this.#main.renderError("알 수 없는 에러가 발생했습니다.");
  }
  #onSubmit = (query) => {
    if (query.trim()) {
      dispatchRouteChange(`/search?query=${encodeURIComponent(query)}`);
    }
  };
  #onDetail = async (movie_id) => {
    try {
      console.log(this.#$modal);
      const movie = await fetchMovieDetails(movie_id);
      this.#$modal.open(movie);
    } catch (e) {
      console.log(e);
    }
  };
}
class LocalStorage {
  #myStorage;
  constructor() {
    this.#myStorage = window.localStorage;
  }
  save(key, value) {
    this.#myStorage.setItem(key, value);
  }
  get(key) {
    return this.#myStorage.getItem(key);
  }
}
class MovieRepository {
  #db;
  constructor(db) {
    this.#db = db;
  }
  saveRate(key, value) {
    return this.#db.save(key, value);
  }
  getRate(key) {
    return this.#db.get(key);
  }
}
const routes = [
  { path: "/", view: HomePage },
  { path: "/search", view: SearchPage }
];
const PAGE_CACHE = /* @__PURE__ */ new Map();
const router = (modal) => {
  const $app = document.querySelector("#app");
  if (!$app) return;
  $app.innerHTML = "";
  const fullHash = location.hash.replace("#", "") || "/";
  const [path] = fullHash.split("?");
  const match = routes.find((route) => route.path === path);
  const View = match ? match.view : HomePage;
  const fullpath = match ? fullHash : "/";
  const cachedPage = PAGE_CACHE.get(fullpath);
  if (cachedPage !== void 0) {
    $app.append(cachedPage.$element);
    return;
  }
  const newPage = new View(modal);
  $app.append(newPage.$element);
  PAGE_CACHE.set(fullpath, newPage);
};
const navigateTo = (url) => {
  location.hash = url;
};
window.addEventListener(CUSTOM_EVENT.ROUTE_CHANGE, (e) => {
  const customEvent = e;
  const { url } = customEvent.detail;
  navigateTo(url);
});
window.addEventListener("scroll", () => {
  const isScrollEnded = window.innerHeight + window.scrollY + 400 >= document.body.offsetHeight;
  if (isScrollEnded) {
    scrollEvent();
  }
});
addEventListener("load", () => {
  const $body = document.querySelector("body");
  if (!$body) return;
  const db = new LocalStorage();
  const movieRepo = new MovieRepository(db);
  const modal = new Modal(movieRepo, $body);
  $body.append(modal.$element);
  window.addEventListener("hashchange", () => router(modal));
  router(modal);
});

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
const $ = (el, selector) => {
  const found = el.querySelector(selector);
  if (!found) throw new Error(`${selector} 없음`);
  return found;
};
class TMDBError extends Error {
  code;
  success;
  constructor({ status_code, status_message, success }) {
    super(status_message);
    this.code = status_code;
    this.success = success;
  }
}
const ErrorComponent = (error) => {
  const $div = document.createElement("div");
  const infoMessage = error instanceof TMDBError ? "TMDB 에러" : "예상치못한 에러";
  $div.className = "nothing";
  $div.innerHTML = `
    <img src="./images/empty.png" alt="nothing" />
    <p>${infoMessage}</p>
  `;
  return $div;
};
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
const PLACEHOLDER = "./images/empty.png";
const getOriginalImageUrl = (src) => {
  if (!src) return PLACEHOLDER;
  return URL.ORIGINAL_IMAGE + src;
};
const getThumbnailImageUrl = (src) => {
  if (!src) return PLACEHOLDER;
  return URL.THUMBNAIL_IMAGE + src;
};
const Star = (filled) => {
  const $img = document.createElement("img");
  $img.className = "star";
  $img.src = filled ? "./images/star_filled.png" : "./images/star_empty.png";
  $img.alt = filled ? "star_filled" : "star_empty";
  return $img;
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
  renderMovies(movies) {
    this.removeSkeletons();
    const $fragment = new DocumentFragment();
    movies.forEach((movie) => $fragment.append(MovieItem(movie)));
    this.#$list.append($fragment);
    return this.#$list.lastElementChild;
  }
  renderSkeletons(length = 20) {
    const $newSkeletons = Array.from({ length }, () => MovieItemSkeleton());
    this.#$skeletons = $newSkeletons;
    $newSkeletons.forEach(($skeleton) => this.#$list.append($skeleton));
  }
  removeSkeletons() {
    this.#$skeletons?.forEach(($skeleton) => $skeleton.remove());
  }
  handleError(error) {
    const $element = $(this.#$element, "section");
    $element.innerHTML = "";
    $element.append(ErrorComponent(error));
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
  #movieStore;
  #$modal;
  #$modalImg;
  #$body;
  constructor(movieRepo, $body) {
    this.#movieStore = movieRepo;
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
    this.#$modalImg = $(this.#$modal, ".modal-image img");
    $(this.#$modal, "button").addEventListener("click", () => this.close());
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.close();
      }
    });
  }
  get $element() {
    return this.#$modal;
  }
  #update(movie) {
    const { title, release_date, overview, poster_path, genres, vote_average } = movie;
    this.#$modalImg.src = getOriginalImageUrl(poster_path);
    $(this.#$modal, "h2").textContent = title;
    const overViewString = overview ? overview : "줄거리 데이터가 없습니다";
    $(this.#$modal, ".detail").textContent = overViewString;
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
  async open(movie) {
    this.#$body.className = "modal-open";
    this.#$modal.classList.add("active");
    this.#update(movie);
    const { id } = movie;
    const movieRate = Number(await this.#movieStore.get(`${id}`)) || 0;
    const $submitRate = new SubmitRate(movieRate, async (rate) => {
      await this.#movieStore.save(`${id}`, String(rate));
    }).$element;
    const $container = $(this.#$modal, ".modal-submit-star");
    const $oldCon = $container.querySelector(".submit-rate-container");
    if ($oldCon) $oldCon.remove();
    $container.append($submitRate);
  }
  renderSkeleton() {
    this.#$modalImg.src = "./images/empty.png";
  }
  close() {
    this.#$body.classList.remove("modal-open");
    this.#$modal.classList.remove("active");
  }
}
class LocalStorage {
  #myStorage;
  constructor() {
    this.#myStorage = window.localStorage;
  }
  async save(key, value) {
    this.#myStorage.setItem(key, value);
  }
  async get(key) {
    return this.#myStorage.getItem(key);
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
const SearchForm = (onSubmit2) => {
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
    onSubmit2(query);
    $input.value = query;
  });
  return $form;
};
const TopRate = (data, onDetail) => {
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
  $($container, "button").addEventListener("click", () => {
    onDetail(data.id);
  });
  return $container;
};
const Overlay = () => {
  const $overlay = document.createElement("div");
  $overlay.className = "overlay";
  $overlay.ariaHidden = "true";
  return $overlay;
};
class Header {
  #$element;
  #$background;
  #$banner;
  #$overlay;
  #$topRate = null;
  #onDetail;
  constructor(onSubmit2, onDetail) {
    this.#$element = document.createElement("header");
    this.#$element.innerHTML = `
      <div class="background-container">
        <div class="banner-container"></div>
      </div>
    `;
    this.#$background = $(this.#$element, ".background-container");
    this.#$banner = $(this.#$element, ".banner-container");
    this.#$overlay = Overlay();
    this.#$overlay.classList.add("hidden");
    this.#$background.prepend(this.#$overlay);
    const $justLayout = document.createElement("div");
    this.#$banner.append(Logo(), SearchForm(onSubmit2), $justLayout);
    this.#$banner.classList.add("hidden");
    this.#onDetail = onDetail;
  }
  get $element() {
    return this.#$element;
  }
  showBanner(data) {
    this.#$background.style.backgroundImage = `url(${getOriginalImageUrl(data.backdrop_path)})`;
    this.#$background.classList.add("top-header-container");
    if (this.#$topRate) this.#$topRate.remove();
    this.#$topRate = TopRate(data, this.#onDetail);
    this.#$background.append(this.#$topRate);
    this.#$overlay.classList.remove("hidden");
    this.#$banner.classList.remove("hidden");
  }
  hideBanner() {
    this.#$overlay.classList.add("hidden");
    this.#$banner.classList.add("hidden");
    this.#$background.classList.remove("top-header-container");
    this.#$background.style.backgroundImage = "";
  }
}
class MoviePage {
  #$div;
  #$header;
  #$main;
  #$modal;
  #totalPage;
  #page;
  #option;
  #observer;
  constructor(option) {
    this.#page = 1;
    this.#totalPage = 1;
    this.#option = option;
    this.#$div = document.createElement("div");
    this.#$header = new Header(option.onSubmit.bind(this), this.#onDetail.bind(this));
    const title = option.type === "home" ? "지금 인기있는 영화" : `"${option.query}" 검색 결과`;
    this.#$main = new Main(title, this.#onDetail.bind(this));
    this.#$modal = new Modal(new LocalStorage(), this.#$div);
    const footer = new Footer();
    this.#$div.append(this.#$header.$element, this.#$main.$element, footer.$element, this.#$modal.$element);
    this.#observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.#loadMore();
        }
      },
      { threshold: 0.1 }
    );
    this.#initialFetch();
  }
  get $element() {
    return this.#$div;
  }
  async #fetchMovie() {
    if (this.#page > this.#totalPage) return;
    const response = await this.#option.fetchMovie(this.#page);
    if (response.results.length === 0) {
      this.#$main.renderNothing();
      return;
    }
    this.#page += 1;
    this.#totalPage = response.total_pages;
    return response;
  }
  async #initialFetch() {
    try {
      this.#$main.renderSkeletons();
      const response = await this.#fetchMovie();
      if (!response) return;
      if (this.#option.type === "home") this.#$header.showBanner(response.results[0]);
      const lastElement = this.#appendMovies(response);
      if (lastElement) this.#observer.observe(lastElement);
    } catch (error) {
      this.#handleError(error);
    } finally {
      this.#$main.removeSkeletons();
    }
  }
  async #loadMore() {
    this.#observer.disconnect();
    try {
      this.#$main.renderSkeletons();
      const response = await this.#fetchMovie();
      if (!response) return;
      const lastElement = this.#appendMovies(response);
      if (lastElement) this.#observer.observe(lastElement);
    } catch (error) {
      this.#handleError(error);
    } finally {
      this.#$main.removeSkeletons();
    }
  }
  #appendMovies(response) {
    return this.#$main.renderMovies(response.results);
  }
  #handleError(error) {
    if (error instanceof Error) {
      console.error(error);
      this.#$main.handleError(error);
    }
  }
  async #onDetail(movie_id) {
    try {
      this.#$modal.renderSkeleton();
      const movie = await this.#option.fetchDetail(movie_id);
      this.#$modal.open(movie);
    } catch (error) {
      console.error(error);
      alert("모달 에러입니다.");
      this.#handleError(error);
    }
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
const onSubmit = (query) => {
  if (query.trim()) {
    location.hash = `/search?query=${encodeURIComponent(query)}`;
  }
};
const createHomePage = () => {
  return new MoviePage({
    type: "home",
    fetchMovie: (page) => fetchPopularMovies(page),
    fetchDetail: (movie_id) => fetchMovieDetails(movie_id),
    onSubmit
  });
};
const createSearchPage = (query) => {
  return new MoviePage({
    type: "search",
    fetchMovie: (page) => fetchSearchMovies(query, page),
    fetchDetail: (movie_id) => fetchMovieDetails(movie_id),
    onSubmit,
    query
  });
};
const router = () => {
  const $app = document.querySelector("#app");
  if (!$app) return;
  const fullHash = location.hash.replace("#", "") || "/";
  const [path, queryString] = fullHash.split("?");
  const query = new URLSearchParams(queryString).get("query") ?? "";
  $app.innerHTML = "";
  const newPage = path === "/search" ? createSearchPage(query) : createHomePage();
  $app.append(newPage.$element);
};
window.addEventListener("load", () => {
  const $body = document.querySelector("body");
  if (!$body) return;
  $body.append();
  window.addEventListener("hashchange", () => router());
  router();
});

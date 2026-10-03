import { supabase } from './supabase.js';


/* =========================================================
   ELEMENTS
========================================================= */

const productsContainer = document.getElementById('products');
const categoriesContainer = document.getElementById('categories');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const productCount = document.getElementById('productCount');


/* =========================================================
   GLOBAL DATA
========================================================= */

let allProducts = [];
let signupMode = false;
let sellerSignupMode = false;

let wishlistProductIds = new Set();

/* Currently opened product */
let selectedProduct = null;


/* =========================================================
   AUTH ELEMENTS
========================================================= */

const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const becomeSellerBtn = document.getElementById('becomeSellerBtn');
const sellerSignupBtn = document.getElementById('sellerSignupBtn');

const closeAuth = document.getElementById('closeAuth');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmit = document.getElementById('authSubmit');
const switchAuth = document.getElementById('switchAuth');

const nameField = document.getElementById('nameField');
const fullName = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authMessage = document.getElementById('authMessage');


/* =========================================================
   ACCOUNT ELEMENTS
========================================================= */

const accountMenu = document.getElementById('accountMenu');
const accountName = document.getElementById('accountName');
const accountEmail = document.getElementById('accountEmail');

const profileBtn = document.getElementById('profileBtn');
const ordersBtn = document.getElementById('ordersBtn');
const wishlistBtn = document.getElementById('wishlistBtn');
const logoutBtn = document.getElementById('logoutBtn');


/* =========================================================
   PROFILE ELEMENTS
========================================================= */

const profileModal = document.getElementById('profileModal');
const closeProfile = document.getElementById('closeProfile');

const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profilePhone = document.getElementById('profilePhone');

const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileMessage = document.getElementById('profileMessage');


/* =========================================================
   CART ELEMENTS
========================================================= */

const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');

const cartItemsContainer = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const cartCount = document.getElementById('cartCount');


/* =========================================================
   ORDERS ELEMENTS
========================================================= */

const ordersModal = document.getElementById('ordersModal');
const closeOrders = document.getElementById('closeOrders');
const ordersList = document.getElementById('ordersList');


/* =========================================================
   CHECKOUT ELEMENTS
========================================================= */

const checkoutModal = document.getElementById('checkoutModal');
const closeCheckout = document.getElementById('closeCheckout');

const checkoutMessage = document.getElementById('checkoutMessage');

const deliveryName = document.getElementById('deliveryName');
const deliveryPhone = document.getElementById('deliveryPhone');
const deliveryAddress = document.getElementById('deliveryAddress');
const deliveryCity = document.getElementById('deliveryCity');

const checkoutTotal = document.getElementById('checkoutTotal');
const placeOrderBtn = document.getElementById('placeOrderBtn');


/* =========================================================
   PRODUCT DETAILS ELEMENTS
========================================================= */

const productDetailsModal =
  document.getElementById('productDetailsModal');

const closeProductDetails =
  document.getElementById('closeProductDetails');

const productDetailsThumbnails =
  document.getElementById('productDetailsThumbnails');

const productDetailsImage =
  document.getElementById('productDetailsImage');

const productDetailsCategory =
  document.getElementById('productDetailsCategory');

const productDetailsName =
  document.getElementById('productDetailsName');

const productDetailsRating =
  document.getElementById('productDetailsRating');

const productDetailsReviews =
  document.getElementById('productDetailsReviews');

const productDetailsPrice =
  document.getElementById('productDetailsPrice');

const productDetailsOldPrice =
  document.getElementById('productDetailsOldPrice');

const productDetailsDiscount =
  document.getElementById('productDetailsDiscount');

const productDetailsStock =
  document.getElementById('productDetailsStock');

const productDetailsDescription =
  document.getElementById('productDetailsDescription');

const productDetailsSpecs =
  document.getElementById('productDetailsSpecs');

const productQuantityMinus =
  document.getElementById('productQuantityMinus');

const productQuantity =
  document.getElementById('productQuantity');

const productQuantityPlus =
  document.getElementById('productQuantityPlus');

const productDetailsAddCart =
  document.getElementById('productDetailsAddCart');

const productDetailsWishlist =
  document.getElementById('productDetailsWishlist');


/* =========================================================
   MOBILE BOTTOM NAVIGATION
========================================================= */

const bottomHomeBtn =
  document.getElementById('bottomHomeBtn');

const bottomCategoriesBtn =
  document.getElementById('bottomCategoriesBtn');

const bottomCartBtn =
  document.getElementById('bottomCartBtn');

const bottomWishlistBtn =
  document.getElementById('bottomWishlistBtn');

const bottomAccountBtn =
  document.getElementById('bottomAccountBtn');

const bottomCartCount =
  document.getElementById('bottomCartCount');


/* =========================================================
   FALLBACK PRODUCT IMAGE
========================================================= */

const fallbackImage =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg"
         width="500"
         height="500"
         viewBox="0 0 500 500">
      <rect width="500" height="500" fill="#f3f3f3"/>
      <text x="250"
            y="235"
            text-anchor="middle"
            font-family="Arial"
            font-size="42"
            font-weight="bold"
            fill="#111">
        SYBER
      </text>
      <text x="250"
            y="285"
            text-anchor="middle"
            font-family="Arial"
            font-size="42"
            font-weight="bold"
            fill="#f28c00">
        MART
      </text>
      <text x="250"
            y="330"
            text-anchor="middle"
            font-family="Arial"
            font-size="18"
            fill="#777">
        Product Image
      </text>
    </svg>
  `);


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/*
  Escape text before putting database values into HTML.
  This also protects the storefront from unexpected HTML.
*/

function escapeHtml(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


/*
  Get a usable product image.
*/

function getProductImage(product) {

  return product?.image_url || fallbackImage;

}


/*
  Convert a possible number to a real number.
*/

function numberValue(value, fallback = 0) {

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;

}


/*
  Find a product in our currently loaded products.
*/

function findProduct(productId) {

  return allProducts.find(
    product =>
      String(product.id) === String(productId)
  );

}


/*
  Get optional product gallery images.

  This supports several possible database formats without
  requiring you to change your products table immediately.
*/

function getProductImages(product) {

  const images = [];

  if (product?.image_url) {
    images.push(product.image_url);
  }

  if (Array.isArray(product?.images)) {

    product.images.forEach(image => {

      if (typeof image === 'string') {
        images.push(image);
      }

    });

  }

  if (Array.isArray(product?.image_urls)) {

    product.image_urls.forEach(image => {

      if (typeof image === 'string') {
        images.push(image);
      }

    });

  }

  if (typeof product?.images === 'string') {

    try {

      const parsed =
        JSON.parse(product.images);

      if (Array.isArray(parsed)) {

        parsed.forEach(image => {

          if (typeof image === 'string') {
            images.push(image);
          }

        });

      }

    } catch {

      /* Ignore invalid JSON */

    }

  }

  return [
    ...new Set(
      images.filter(Boolean)
    )
  ];

}


/* =========================================================
   LOAD CATEGORIES
========================================================= */

async function loadCategories() {

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {

    console.error(
      'Category error:',
      error
    );

    if (categoriesContainer) {

      categoriesContainer.innerHTML =
        '<p>Unable to load categories.</p>';

    }

    return;
  }

  if (!categoriesContainer) return;

  categoriesContainer.innerHTML = `
    <button
      class="category"
      data-category="all">
      All Products
    </button>
  `;

  (data || []).forEach(category => {

    categoriesContainer.innerHTML += `
      <button
        class="category"
        data-category="${escapeHtml(category.id)}">
        ${escapeHtml(category.name)}
      </button>
    `;

  });


  document
    .querySelectorAll('.category')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const categoryId =
            button.dataset.category;

          if (categoryId === 'all') {

            displayProducts(allProducts);

          } else {

            const filtered =
              allProducts.filter(
                product =>
                  String(product.category_id) ===
                  String(categoryId)
              );

            displayProducts(filtered);

          }

          if (productsContainer) {

            productsContainer.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });

          }

        }
      );

    });

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

  if (productsContainer) {

    productsContainer.innerHTML =
      '<p>Loading products...</p>';

  }

  const {
    data,
    error
  } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        name
      )
    `)
    .eq('is_active', true)
    .order('created_at', {
      ascending: false
    });

  if (error) {

    console.error(
      'Product error:',
      error
    );

    if (productsContainer) {

      productsContainer.innerHTML =
        '<p>Unable to load products. Check the browser console.</p>';

    }

    return;
  }

  allProducts = data || [];

  displayProducts(allProducts);

}


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function displayProducts(products) {

  if (!productsContainer) return;

  const productList =
    Array.isArray(products)
      ? products
      : [];

  if (productCount) {

    productCount.textContent =
      `${productList.length} product${
        productList.length === 1
          ? ''
          : 's'
      }`;

  }


  if (productList.length === 0) {

    productsContainer.innerHTML =
      '<p>No products found.</p>';

    return;

  }


  productsContainer.innerHTML = '';


  productList.forEach(product => {

    const image =
      getProductImage(product);

    const isWishlisted =
      wishlistProductIds.has(
        String(product.id)
      );

    const price =
      numberValue(product.price);


    productsContainer.innerHTML += `

      <article
        class="product"
        data-product-id="${escapeHtml(product.id)}"
        style="position:relative; cursor:pointer;"
      >

        <button
          class="product-wishlist-btn ${
            isWishlisted ? 'active' : ''
          }"
          data-product-id="${escapeHtml(product.id)}"
          aria-label="${
            isWishlisted
              ? 'Remove from wishlist'
              : 'Add to wishlist'
          }"
          title="${
            isWishlisted
              ? 'Remove from wishlist'
              : 'Add to wishlist'
          }"
          type="button"
          style="
            position:absolute;
            top:10px;
            right:10px;
            z-index:5;
            width:40px;
            height:40px;
            border:none;
            border-radius:50%;
            background:#ffffff;
            box-shadow:0 2px 10px rgba(0,0,0,0.12);
            cursor:pointer;
            font-size:25px;
            line-height:40px;
            padding:0;
            color:${
              isWishlisted
                ? '#ff3b30'
                : '#222'
            };
          "
        >
          ${
            isWishlisted
              ? '♥'
              : '♡'
          }
        </button>


        <img
          class="product-image"
          src="${escapeHtml(image)}"
          alt="${escapeHtml(product.name)}"
          onerror="
            this.onerror=null;
            this.src='${fallbackImage}';
          "
        >


        <div class="product-info">

          <h3 class="product-name">
            ${escapeHtml(product.name)}
          </h3>


          ${
            product.brand
              ? `
                <small class="product-brand">
                  ${escapeHtml(product.brand)}
                </small>
              `
              : ''
          }


          <p class="product-price">
            GH₵ ${price.toFixed(2)}
          </p>


          <button
            class="add-cart"
            data-product-id="${escapeHtml(product.id)}"
            type="button"
          >
            Add to Cart
          </button>

        </div>

      </article>

    `;

  });


  /* =====================================================
     PRODUCT DETAILS CLICK
  ===================================================== */

  document
    .querySelectorAll('.product')
    .forEach(card => {

      card.addEventListener(
        'click',
        event => {

          if (
            event.target.closest(
              '.product-wishlist-btn'
            )
          ) {
            return;
          }

          if (
            event.target.closest(
              '.add-cart'
            )
          ) {
            return;
          }

          openProductDetails(
            card.dataset.productId
          );

        }
      );

    });


  /* =====================================================
     ADD TO CART BUTTONS
  ===================================================== */

  document
    .querySelectorAll('.add-cart')
    .forEach(button => {

      button.addEventListener(
        'click',
        event => {

          event.stopPropagation();

          addToCart(
            button.dataset.productId,
            1
          );

        }
      );

    });


  /* =====================================================
     WISHLIST BUTTONS
  ===================================================== */

  document
    .querySelectorAll('.product-wishlist-btn')
    .forEach(button => {

      button.addEventListener(
        'click',
        event => {

          event.stopPropagation();

          toggleWishlist(
            button.dataset.productId
          );

        }
      );

    });

}


/* =========================================================
   PRODUCT DETAILS
========================================================= */

function openProductDetails(productId) {

  const product =
    findProduct(productId);

  if (!product) {

    console.error(
      'Product not found:',
      productId
    );

    return;

  }

  selectedProduct = product;


  if (!productDetailsModal) {
    return;
  }


  /* =====================================================
     BASIC INFORMATION
  ===================================================== */

  const categoryName =
    product.categories?.name ||
    product.category_name ||
    'Product';


  const price =
    numberValue(product.price);


  const stock =
    numberValue(product.stock);


  const description =
    product.description ||
    'No product description is available yet.';


  if (productDetailsCategory) {

    productDetailsCategory.textContent =
      categoryName;

  }


  if (productDetailsName) {

    productDetailsName.textContent =
      product.name || 'Product';

  }


  if (productDetailsPrice) {

    productDetailsPrice.textContent =
      `GH₵ ${price.toFixed(2)}`;

  }


  if (productDetailsDescription) {

    productDetailsDescription.textContent =
      description;

  }


  /* =====================================================
     STOCK
  ===================================================== */

  if (productDetailsStock) {

    if (stock > 0) {

      productDetailsStock.textContent =
        `● ${stock} available`;

      productDetailsStock.classList.remove(
        'out-of-stock'
      );

      productDetailsStock.classList.add(
        'in-stock'
      );

    } else {

      productDetailsStock.textContent =
        '● Out of stock';

      productDetailsStock.classList.remove(
        'in-stock'
      );

      productDetailsStock.classList.add(
        'out-of-stock'
      );

    }

  }


  /* =====================================================
     RATING
  ===================================================== */

  const rating =
    numberValue(
      product.rating ??
      product.average_rating ??
      0
    );


  const reviewCount =
    numberValue(
      product.reviews_count ??
      product.review_count ??
      product.reviews ??
      0
    );


  if (productDetailsRating) {

    if (rating > 0) {

      const rounded =
        Math.min(
          5,
          Math.max(
            0,
            Math.round(rating)
          )
        );

      productDetailsRating.textContent =
        '★'.repeat(rounded) +
        '☆'.repeat(5 - rounded);

    } else {

      productDetailsRating.textContent =
        '★★★★★';

    }

  }


  if (productDetailsReviews) {

    if (reviewCount > 0) {

      productDetailsReviews.textContent =
        `${reviewCount} review${
          reviewCount === 1
            ? ''
            : 's'
        }`;

    } else {

      productDetailsReviews.textContent =
        'No reviews yet';

    }

  }


  /* =====================================================
     OLD PRICE / DISCOUNT
  ===================================================== */

  const oldPrice =
    numberValue(
      product.old_price ??
      product.compare_at_price ??
      product.original_price ??
      0
    );


  let discount =
    numberValue(
      product.discount_percentage ??
      product.discount ??
      0
    );


  if (
    !discount &&
    oldPrice > price &&
    oldPrice > 0
  ) {

    discount =
      Math.round(
        ((oldPrice - price) /
          oldPrice) *
          100
      );

  }


  if (productDetailsOldPrice) {

    if (oldPrice > price) {

      productDetailsOldPrice.textContent =
        `GH₵ ${oldPrice.toFixed(2)}`;

      productDetailsOldPrice.style.display =
        'inline';

    } else {

      productDetailsOldPrice.textContent =
        '';

      productDetailsOldPrice.style.display =
        'none';

    }

  }


  if (productDetailsDiscount) {

    if (discount > 0) {

      productDetailsDiscount.textContent =
        `-${Math.round(discount)}%`;

      productDetailsDiscount.style.display =
        'inline';

    } else {

      productDetailsDiscount.textContent =
        '';

      productDetailsDiscount.style.display =
        'none';

    }

  }


  /* =====================================================
     SPECIFICATIONS
  ===================================================== */

  renderProductSpecifications(product);


  /* =====================================================
     PRODUCT IMAGES
  ===================================================== */

  renderProductImages(product);


  /* =====================================================
     QUANTITY
  ===================================================== */

  if (productQuantity) {

    productQuantity.value =
      stock > 0
        ? '1'
        : '0';

  }


  if (productDetailsAddCart) {

    productDetailsAddCart.disabled =
      stock <= 0;

    productDetailsAddCart.textContent =
      stock > 0
        ? '🛒 Add to Cart'
        : 'Out of Stock';

  }


  /* =====================================================
     WISHLIST BUTTON
  ===================================================== */

  updateProductDetailsWishlistButton();


  /* =====================================================
     SHOW MODAL
  ===================================================== */

  productDetailsModal.classList.add(
    'show'
  );

  document.body.classList.add(
    'no-scroll'
  );

}


/* =========================================================
   PRODUCT IMAGES
========================================================= */

function renderProductImages(product) {

  if (!productDetailsImage) {
    return;
  }


  const images =
    getProductImages(product);


  const usableImages =
    images.length
      ? images
      : [fallbackImage];


  productDetailsImage.src =
    usableImages[0];

  productDetailsImage.alt =
    product.name || 'Product';


  productDetailsImage.onerror =
    function () {

      this.onerror = null;
      this.src = fallbackImage;

    };


  if (!productDetailsThumbnails) {
    return;
  }


  productDetailsThumbnails.innerHTML =
    '';


  usableImages.forEach(
    (image, index) => {

      const thumbnail =
        document.createElement(
          'button'
        );

      thumbnail.type =
        'button';

      thumbnail.className =
        'product-thumbnail';

      if (index === 0) {

        thumbnail.classList.add(
          'active'
        );

      }


      const thumbnailImage =
        document.createElement(
          'img'
        );

      thumbnailImage.src =
        image;

      thumbnailImage.alt =
        `${product.name || 'Product'} image ${
          index + 1
        }`;


      thumbnailImage.onerror =
        function () {

          this.onerror = null;
          this.src = fallbackImage;

        };


      thumbnail.appendChild(
        thumbnailImage
      );


      thumbnail.addEventListener(
        'click',
        () => {

          productDetailsImage.src =
            image;

          document
            .querySelectorAll(
              '.product-thumbnail'
            )
            .forEach(item => {

              item.classList.remove(
                'active'
              );

            });

          thumbnail.classList.add(
            'active'
          );

        }
      );


      productDetailsThumbnails.appendChild(
        thumbnail
      );

    }
  );

}


/* =========================================================
   PRODUCT SPECIFICATIONS
========================================================= */

function renderProductSpecifications(product) {

  if (!productDetailsSpecs) {
    return;
  }


  const specifications = [];


  /*
    These fields are optional.
    If your products table contains them,
    they will automatically appear.
  */

  if (product.brand) {

    specifications.push([
      'Brand',
      product.brand
    ]);

  }


  if (product.sku) {

    specifications.push([
      'SKU',
      product.sku
    ]);

  }


  if (product.category_name) {

    specifications.push([
      'Category',
      product.category_name
    ]);

  } else if (product.categories?.name) {

    specifications.push([
      'Category',
      product.categories.name
    ]);

  }


  if (product.condition) {

    specifications.push([
      'Condition',
      product.condition
    ]);

  }


  if (product.color) {

    specifications.push([
      'Color',
      product.color
    ]);

  }


  if (product.size) {

    specifications.push([
      'Size',
      product.size
    ]);

  }


  if (product.weight) {

    specifications.push([
      'Weight',
      product.weight
    ]);

  }


  if (product.material) {

    specifications.push([
      'Material',
      product.material
    ]);

  }


  if (product.stock !== undefined) {

    specifications.push([
      'Availability',
      numberValue(product.stock) > 0
        ? 'In Stock'
        : 'Out of Stock'
    ]);

  }


  if (specifications.length === 0) {

    productDetailsSpecs.innerHTML = `
      <div class="product-spec-row">
        <span>Product</span>
        <strong>
          ${escapeHtml(
            product.name || 'SYBER MART Product'
          )}
        </strong>
      </div>

      <div class="product-spec-row">
        <span>Availability</span>
        <strong>
          ${
            numberValue(product.stock) > 0
              ? 'In Stock'
              : 'Out of Stock'
          }
        </strong>
      </div>
    `;

    return;

  }


  productDetailsSpecs.innerHTML =
    specifications
      .map(
        ([label, value]) => `
          <div class="product-spec-row">

            <span>
              ${escapeHtml(label)}
            </span>

            <strong>
              ${escapeHtml(value)}
            </strong>

          </div>
        `
      )
      .join('');

}


/* =========================================================
   UPDATE DETAILS WISHLIST BUTTON
========================================================= */

function updateProductDetailsWishlistButton() {

  if (
    !productDetailsWishlist ||
    !selectedProduct
  ) {
    return;
  }


  const isWishlisted =
    wishlistProductIds.has(
      String(selectedProduct.id)
    );


  if (isWishlisted) {

    productDetailsWishlist.textContent =
      '♥ Remove from Wishlist';

    productDetailsWishlist.classList.add(
      'active'
    );

  } else {

    productDetailsWishlist.textContent =
      '♡ Add to Wishlist';

    productDetailsWishlist.classList.remove(
      'active'
    );

  }

}


/* =========================================================
   CLOSE PRODUCT DETAILS
========================================================= */

function closeProductDetailsModal() {

  productDetailsModal?.classList.remove(
    'show'
  );

  document.body.classList.remove(
    'no-scroll'
  );

  selectedProduct = null;

}


closeProductDetails?.addEventListener(
  'click',
  closeProductDetailsModal
);


productDetailsModal?.addEventListener(
  'click',
  event => {

    if (
      event.target ===
      productDetailsModal
    ) {

      closeProductDetailsModal();

    }

  }
);


/* =========================================================
   PRODUCT QUANTITY MINUS
========================================================= */

productQuantityMinus?.addEventListener(
  'click',
  () => {

    if (!selectedProduct) return;

    const stock =
      numberValue(
        selectedProduct.stock
      );

    let quantity =
      numberValue(
        productQuantity?.value,
        1
      );


    quantity =
      Math.max(
        1,
        quantity - 1
      );


    if (stock > 0) {

      quantity =
        Math.min(
          quantity,
          stock
        );

    }


    if (productQuantity) {

      productQuantity.value =
        String(quantity);

    }

  }
);


/* =========================================================
   PRODUCT QUANTITY PLUS
========================================================= */

productQuantityPlus?.addEventListener(
  'click',
  () => {

    if (!selectedProduct) return;

    const stock =
      numberValue(
        selectedProduct.stock
      );


    if (stock <= 0) {

      alert(
        'This product is out of stock.'
      );

      return;

    }


    let quantity =
      numberValue(
        productQuantity?.value,
        1
      );


    if (quantity >= stock) {

      alert(
        'You have reached the available stock.'
      );

      return;

    }


    quantity += 1;


    if (productQuantity) {

      productQuantity.value =
        String(quantity);

    }

  }
);


/* =========================================================
   ADD PRODUCT DETAILS ITEM TO CART
========================================================= */

productDetailsAddCart?.addEventListener(
  'click',
  async () => {

    if (!selectedProduct) {
      return;
    }


    const quantity =
      Math.max(
        1,
        numberValue(
          productQuantity?.value,
          1
        )
      );


    const stock =
      numberValue(
        selectedProduct.stock
      );


    if (stock <= 0) {

      alert(
        'This product is currently out of stock.'
      );

      return;

    }


    if (quantity > stock) {

      alert(
        'The selected quantity is greater than the available stock.'
      );

      return;

    }


    const success =
      await addToCart(
        selectedProduct.id,
        quantity
      );


    if (success) {

      closeProductDetailsModal();

    }

  }
);


/* =========================================================
   PRODUCT DETAILS WISHLIST
========================================================= */

productDetailsWishlist?.addEventListener(
  'click',
  async () => {

    if (!selectedProduct) {
      return;
    }


    await toggleWishlist(
      selectedProduct.id
    );


    updateProductDetailsWishlistButton();

  }
);


/* =========================================================
   SEARCH
========================================================= */

function searchProducts() {

  if (!searchInput) return;

  const searchTerm =
    searchInput.value
      .trim()
      .toLowerCase();


  if (!searchTerm) {

    displayProducts(
      allProducts
    );

    return;

  }


  const results =
    allProducts.filter(
      product => {

        const name =
          product.name?.toLowerCase() ||
          '';

        const description =
          product.description?.toLowerCase() ||
          '';

        const brand =
          product.brand?.toLowerCase() ||
          '';

        const category =
          product.categories?.name?.toLowerCase() ||
          '';


        return (
          name.includes(searchTerm) ||
          description.includes(searchTerm) ||
          brand.includes(searchTerm) ||
          category.includes(searchTerm)
        );

      }
    );


  displayProducts(results);

}


searchBtn?.addEventListener(
  'click',
  searchProducts
);


searchInput?.addEventListener(
  'keydown',
  event => {

    if (event.key === 'Enter') {

      searchProducts();

    }

  }
);


/* =========================================================
   ADD TO CART
========================================================= */

async function addToCart(
  productId,
  requestedQuantity = 1
) {

  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) {

    if (authMessage) {

      authMessage.textContent =
        'Please log in to add products to your cart.';

    }

    authModal?.classList.add(
      'show'
    );

    return false;

  }


  const quantityToAdd =
    Math.max(
      1,
      Number(requestedQuantity) || 1
    );


  /* =====================================================
     GET PRODUCT STOCK
  ===================================================== */

  const {
    data: product,
    error: productError
  } = await supabase
    .from('products')
    .select('id, name, stock, is_active')
    .eq('id', productId)
    .maybeSingle();


  if (productError) {

    console.error(
      'Product stock error:',
      productError
    );

    alert(
      'Could not check product availability.'
    );

    return false;

  }


  if (!product) {

    alert(
      'This product could not be found.'
    );

    return false;

  }


  if (product.is_active === false) {

    alert(
      'This product is no longer available.'
    );

    return false;

  }


  const stock =
    numberValue(product.stock);


  if (stock <= 0) {

    alert(
      'This product is out of stock.'
    );

    return false;

  }


  /* =====================================================
     CHECK EXISTING CART ITEM
  ===================================================== */

  const {
    data: existing,
    error: existingError
  } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();


  if (existingError) {

    console.error(
      'Cart check error:',
      existingError
    );

    alert(
      `Could not check your cart.\n\n${existingError.message}`
    );

    return false;

  }


  const currentQuantity =
    Number(
      existing?.quantity || 0
    );


  const newQuantity =
    currentQuantity +
    quantityToAdd;


  if (newQuantity > stock) {

    alert(
      `Only ${stock} ${
        stock === 1
          ? 'unit is'
          : 'units are'
      } available.`
    );

    return false;

  }


  /* =====================================================
     UPDATE OR INSERT
  ===================================================== */

  if (existing) {

    const {
      error
    } = await supabase
      .from('cart_items')
      .update({
        quantity: newQuantity
      })
      .eq('id', existing.id)
      .eq('user_id', user.id);


    if (error) {

      console.error(
        'Cart update error:',
        error
      );

      alert(
        `Could not update your cart.\n\n${error.message}`
      );

      return false;

    }

  } else {

    const {
      error
    } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id: productId,
        quantity: quantityToAdd
      });


    if (error) {

      console.error(
        'Cart insert error:',
        error
      );

      alert(
        `Could not add product to cart.\n\n${error.message}`
      );

      return false;

    }

  }


  await updateCartCount();


  alert(
    quantityToAdd === 1
      ? 'Product added to cart!'
      : `${quantityToAdd} products added to cart!`
  );


  return true;

}


/* =========================================================
   CART COUNT
========================================================= */

async function updateCartCount() {

  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) {

    if (cartCount) {
      cartCount.textContent = '0';
    }

    if (bottomCartCount) {
      bottomCartCount.textContent = '0';
    }

    return;

  }


  const {
    data,
    error
  } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', user.id);


  if (error) {

    console.error(
      'Cart count error:',
      error
    );

    return;

  }


  const count =
    (data || []).reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );


  if (cartCount) {
    cartCount.textContent =
      count;
  }

  if (bottomCartCount) {
    bottomCartCount.textContent =
      count;
  }

}


/* =========================================================
   LOGIN / ACCOUNT BUTTON
========================================================= */

loginBtn?.addEventListener(
  'click',
  async event => {

    event.stopPropagation();


    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      accountMenu?.classList.remove(
        'show'
      );

      if (authMessage) {
        authMessage.textContent = '';
      }

      authModal?.classList.add(
        'show'
      );

      return;

    }


    await loadAccount();

    accountMenu?.classList.toggle(
      'show'
    );

  }
);


/* =========================================================
   BECOME SELLER
========================================================= */

becomeSellerBtn?.addEventListener(
  'click',
  async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      alert(
        'Please log in first.'
      );

      return;

    }


    const {
      data: profile,
      error: profileError
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();


    if (profileError) {

      console.error(
        'Role check error:',
        profileError
      );

      alert(
        'Unable to check your seller account.'
      );

      return;

    }


    if (profile?.role === 'seller') {

      window.location.href =
        'seller.html';

      return;

    }


    if (profile?.role === 'admin') {

      const openAdmin =
        confirm(
          'You are an administrator.\n\n' +
          'Would you like to open the Admin Dashboard?'
        );


      if (openAdmin) {

        window.location.href =
          'admin.html';

      }

      return;

    }


    const confirmed =
      confirm(
        'Become a SYBER MART seller?\n\n' +
        'You will be able to add and manage your own products.'
      );


    if (!confirmed) {
      return;
    }


    becomeSellerBtn.disabled =
      true;

    becomeSellerBtn.textContent =
      'Setting up seller account...';


    const {
      error
    } = await supabase.rpc(
      'become_seller'
    );


    if (error) {

      console.error(
        'Become seller error:',
        error
      );

      alert(
        `Unable to create seller account:\n${error.message}`
      );

      becomeSellerBtn.disabled =
        false;

      becomeSellerBtn.textContent =
        '🏪 Become a Seller';

      return;

    }


    alert(
      '🎉 Your seller account is ready!\n\n' +
      'Welcome to SYBER MART Sellers.'
    );


    window.location.href =
      'seller.html';

  }
);


/* =========================================================
   CLOSE AUTH
========================================================= */

closeAuth?.addEventListener(
  'click',
  () => {

    authModal?.classList.remove(
      'show'
    );

  }
);


/* =========================================================
   SWITCH LOGIN / CUSTOMER SIGNUP
========================================================= */

switchAuth?.addEventListener(
  'click',
  () => {

    sellerSignupMode =
      false;

    signupMode =
      !signupMode;


    if (signupMode) {

      authTitle.textContent =
        'Create SYBER MART Account';

      nameField.style.display =
        'block';

      fullName.required =
        true;

      authSubmit.textContent =
        'Create Account';

      switchAuth.textContent =
        'Already have an account? Login';

    } else {

      authTitle.textContent =
        'Login to SYBER MART';

      nameField.style.display =
        'none';

      fullName.required =
        false;

      authSubmit.textContent =
        'Login';

      switchAuth.textContent =
        "Don't have an account? Create one";

    }


    authMessage.textContent =
      '';

  }
);


/* =========================================================
   SELLER SIGNUP
========================================================= */

sellerSignupBtn?.addEventListener(
  'click',
  () => {

    sellerSignupMode =
      true;

    signupMode =
      true;


    authTitle.textContent =
      'Become a Seller';

    authSubmit.textContent =
      'Create Seller Account';


    nameField.style.display =
      'block';

    fullName.required =
      true;


    switchAuth.textContent =
      'Already have an account? Login';


    authMessage.textContent =
      'Create your seller account to start selling on SYBER MART.';


    authModal?.classList.add(
      'show'
    );

  }
);


/* =========================================================
   LOGIN / SIGNUP SUBMIT
========================================================= */

authForm?.addEventListener(
  'submit',
  async event => {

    event.preventDefault();


    authMessage.textContent =
      'Please wait...';


    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    /* =====================================================
       SIGNUP
    ===================================================== */

    if (signupMode) {

      const name =
        fullName.value.trim();


      if (!name) {

        authMessage.textContent =
          'Please enter your full name.';

        return;

      }


      const {
        data,
        error
      } = await supabase.auth.signUp({

        email,

        password,

        options: {
          data: {
            full_name: name
          }
        }

      });


      if (error) {

        authMessage.textContent =
          error.message;

        return;

      }


      /* ===================================================
         SELLER SIGNUP
      =================================================== */

      if (sellerSignupMode) {

        if (!data.session) {

          authMessage.textContent =
            '✅ Seller account created. Please confirm your email, then log in to activate your seller account.';

          sellerSignupMode =
            false;

          signupMode =
            false;

          return;

        }


        const {
          error: sellerError
        } = await supabase.rpc(
          'become_seller'
        );


        if (sellerError) {

          console.error(
            'Seller upgrade error:',
            sellerError
          );

          authMessage.textContent =
            `Account created, but seller setup failed: ${sellerError.message}`;

          return;

        }


        sellerSignupMode =
          false;

        signupMode =
          false;


        authMessage.textContent =
          '✅ Seller account created successfully!';


        setTimeout(
          () => {

            window.location.href =
              'seller.html';

          },
          1000
        );


        return;

      }


      /* ===================================================
         NORMAL CUSTOMER SIGNUP
      =================================================== */

      authMessage.textContent =
        'Account created successfully. Check your email if confirmation is required.';


      signupMode =
        false;


      nameField.style.display =
        'none';

      fullName.required =
        false;


      authTitle.textContent =
        'Login to SYBER MART';


      authSubmit.textContent =
        'Login';


      switchAuth.textContent =
        "Don't have an account? Create one";


      return;

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    const {
      error
    } = await supabase.auth.signInWithPassword({

      email,

      password

    });


    if (error) {

      authMessage.textContent =
        error.message;

      return;

    }


    authMessage.textContent =
      'Login successful!';


    setTimeout(
      async () => {

        authModal?.classList.remove(
          'show'
        );

        authForm?.reset();

        await updateAuthButton();

        await updateCartCount();

        await loadWishlistIds();

      },
      700
    );

  }
);


/* =========================================================
   UPDATE AUTH BUTTON
========================================================= */

async function updateAuthButton() {

  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (user) {

    /*
      Keep the existing header structure intact.
      Change only the visible text.
    */

    const textElement =
      loginBtn?.querySelector(
        'span:last-child'
      );


    if (textElement) {

      textElement.textContent =
        'Account';

    } else if (loginBtn) {

      loginBtn.textContent =
        'Account';

    }

  } else {

    const textElement =
      loginBtn?.querySelector(
        'span:last-child'
      );


    if (textElement) {

      textElement.textContent =
        'Login';

    } else if (loginBtn) {

      loginBtn.textContent =
        'Login';

    }


    accountMenu?.classList.remove(
      'show'
    );

  }

}


/* =========================================================
   LOAD ACCOUNT
========================================================= */

async function loadAccount() {

  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) return;


  if (accountEmail) {

    accountEmail.textContent =
      user.email || '';

  }


  const metadataName =
    user.user_metadata?.full_name;


  if (accountName) {

    accountName.textContent =
      metadataName ||
      'My Account';

  }


  const {
    data: profile,
    error
  } = await supabase
    .from('profiles')
    .select(
      'full_name, phone, role'
    )
    .eq('id', user.id)
    .maybeSingle();


  if (
    !error &&
    profile?.full_name &&
    accountName
  ) {

    accountName.textContent =
      profile.full_name;

  }

}


/* =========================================================
   LOG OUT
========================================================= */

logoutBtn?.addEventListener(
  'click',
  async event => {

    event.stopPropagation();


    const {
      error
    } = await supabase.auth.signOut();


    if (error) {

      console.error(error);

      alert(
        'Unable to log out.'
      );

      return;

    }


    accountMenu?.classList.remove(
      'show'
    );


    wishlistProductIds.clear();


    displayProducts(
      allProducts
    );


    await updateAuthButton();

    await updateCartCount();


    alert(
      'You have been logged out.'
    );

  }
);


/* =========================================================
   CLOSE ACCOUNT MENU OUTSIDE
========================================================= */

document.addEventListener(
  'click',
  event => {

    if (
      accountMenu &&
      !accountMenu.contains(
        event.target
      ) &&
      event.target !== loginBtn
    ) {

      accountMenu.classList.remove(
        'show'
      );

    }

  }
);


/* =========================================================
   PROFILE
========================================================= */

profileBtn?.addEventListener(
  'click',
  async () => {

    accountMenu?.classList.remove(
      'show'
    );


    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();


    if (
      userError ||
      !user
    ) {

      alert(
        'Please log in first.'
      );

      return;

    }


    profileEmail.value =
      user.email || '';


    const {
      data: profile,
      error
    } = await supabase
      .from('profiles')
      .select(
        'full_name, phone'
      )
      .eq('id', user.id)
      .maybeSingle();


    if (error) {

      console.error(
        'Profile loading error:',
        error
      );

    }


    profileName.value =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      '';


    profilePhone.value =
      profile?.phone ||
      '';


    profileMessage.textContent =
      '';


    profileModal?.classList.add(
      'show'
    );

  }
);


/* =========================================================
   CLOSE PROFILE
========================================================= */

closeProfile?.addEventListener(
  'click',
  () => {

    profileModal?.classList.remove(
      'show'
    );

  }
);


/* =========================================================
   SAVE PROFILE
========================================================= */

saveProfileBtn?.addEventListener(
  'click',
  async () => {

    const name =
      profileName.value.trim();

    const phone =
      profilePhone.value.trim();


    if (!name) {

      profileMessage.textContent =
        'Please enter your full name.';

      return;

    }


    saveProfileBtn.disabled =
      true;

    saveProfileBtn.textContent =
      'Saving...';


    profileMessage.textContent =
      '';


    const {
      error
    } = await supabase.rpc(
      'update_my_profile',
      {
        p_full_name: name,
        p_phone: phone
      }
    );


    if (error) {

      console.error(
        'Profile update error:',
        error
      );

      profileMessage.textContent =
        'Could not save your profile.';


      saveProfileBtn.disabled =
        false;

      saveProfileBtn.textContent =
        'Save Changes';

      return;

    }


    profileMessage.textContent =
      'Profile saved successfully!';


    if (accountName) {

      accountName.textContent =
        name;

    }


    saveProfileBtn.disabled =
      false;

    saveProfileBtn.textContent =
      'Save Changes';

  }
);


/* =========================================================
   MY ORDERS
========================================================= */

ordersBtn?.addEventListener(
  'click',
  async () => {

    accountMenu?.classList.remove(
      'show'
    );


    ordersModal?.classList.add(
      'show'
    );


    await loadOrders();

  }
);


closeOrders?.addEventListener(
  'click',
  () => {

    ordersModal?.classList.remove(
      'show'
    );

  }
);


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

  if (!ordersList) return;


  ordersList.innerHTML =
    '<p>Loading orders...</p>';


  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) {

    ordersList.innerHTML =
      '<p>Please log in to view your orders.</p>';

    return;

  }


  const {
    data: orders,
    error
  } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', {
      ascending: false
    });


  if (error) {

    console.error(
      'Orders error:',
      error
    );

    ordersList.innerHTML =
      '<p>Unable to load your orders.</p>';

    return;

  }


  if (
    !orders ||
    orders.length === 0
  ) {

    ordersList.innerHTML = `

      <div class="empty-orders">

        <p>
          📦 You have no orders yet.
        </p>

        <p>
          Your orders will appear here after checkout.
        </p>

      </div>

    `;

    return;

  }


  ordersList.innerHTML =
    '';


  orders.forEach(
    order => {

      const date =
        new Date(
          order.created_at
        ).toLocaleDateString();


      ordersList.innerHTML += `

        <div class="order-card">

          <div class="order-header">

            <strong>
              Order #${escapeHtml(
                order.order_number ||
                order.id
              )}
            </strong>

            <span>
              ${escapeHtml(date)}
            </span>

          </div>


          <div class="order-details">

            <p>
              <strong>Total:</strong>
              GH₵ ${numberValue(
                order.total_amount
              ).toFixed(2)}
            </p>


            <p>
              <strong>Payment:</strong>
              ${escapeHtml(
                order.payment_status
              )}
            </p>


            <p>
              <strong>Status:</strong>
              ${escapeHtml(
                order.status
              )}
            </p>

          </div>

        </div>

      `;

    }
  );

}


/* =========================================================
   LOAD WISHLIST IDS
========================================================= */

async function loadWishlistIds() {

  const {
    data: { user }
  } = await supabase.auth.getUser();


  wishlistProductIds.clear();


  if (!user) {

    if (allProducts.length) {

      displayProducts(
        allProducts
      );

    }

    return;

  }


  const {
    data,
    error
  } = await supabase
    .from('wishlist')
    .select('product_id')
    .eq('user_id', user.id);


  if (error) {

    console.error(
      'Wishlist loading error:',
      error
    );

    if (allProducts.length) {

      displayProducts(
        allProducts
      );

    }

    return;

  }


  (data || []).forEach(
    item => {

      wishlistProductIds.add(
        String(
          item.product_id
        )
      );

    }
  );


  if (allProducts.length) {

    displayProducts(
      allProducts
    );

  }

}


/* =========================================================
   TOGGLE WISHLIST
========================================================= */

async function toggleWishlist(
  productId
) {

  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) {

    if (authMessage) {

      authMessage.textContent =
        'Please log in to use your wishlist.';

    }

    authModal?.classList.add(
      'show'
    );

    return false;

  }


  const productKey =
    String(productId);


  const alreadyWishlisted =
    wishlistProductIds.has(
      productKey
    );


  /* =====================================================
     REMOVE
  ===================================================== */

  if (alreadyWishlisted) {

    const {
      error
    } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);


    if (error) {

      console.error(
        'Remove wishlist error:',
        error
      );

      alert(
        `Could not remove this product from your wishlist.\n\n${error.message}`
      );

      return false;

    }


    wishlistProductIds.delete(
      productKey
    );


    updateProductDetailsWishlistButton();


  }


  /* =====================================================
     ADD
  ===================================================== */

  else {

    const {
      error
    } = await supabase
      .from('wishlist')
      .insert({
        user_id: user.id,
        product_id: productId
      });


    if (error) {

      console.error(
        'Add wishlist error:',
        error
      );

      alert(
        `Could not add this product to your wishlist.\n\n${error.message}`
      );

      return false;

    }


    wishlistProductIds.add(
      productKey
    );


    updateProductDetailsWishlistButton();

  }


  /* =====================================================
     REFRESH PRODUCT CARDS
  ===================================================== */

  const searchTerm =
    searchInput?.value
      .trim()
      .toLowerCase() ||
    '';


  if (searchTerm) {

    searchProducts();

  } else {

    displayProducts(
      allProducts
    );

  }


  return true;

}


/* =========================================================
   CREATE WISHLIST MODAL
========================================================= */

function createWishlistModal() {

  const existing =
    document.getElementById(
      'wishlistModal'
    );


  if (existing) {

    return existing;

  }


  const modal =
    document.createElement(
      'div'
    );


  modal.id =
    'wishlistModal';

  modal.className =
    'modal';


  modal.innerHTML = `

    <div
      class="modal-content"
      style="
        max-width:650px;
        width:92%;
        max-height:85vh;
        overflow-y:auto;
      ">

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:15px;
          margin-bottom:20px;
        ">

        <h2 style="margin:0;">
          ❤️ My Wishlist
        </h2>


        <button
          id="closeWishlist"
          type="button"
          style="
            border:none;
            background:none;
            font-size:30px;
            cursor:pointer;
            line-height:1;
          "
        >
          ×
        </button>

      </div>


      <div id="wishlistItems">
        <p>Loading wishlist...</p>
      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  const closeWishlist =
    document.getElementById(
      'closeWishlist'
    );


  closeWishlist?.addEventListener(
    'click',
    () => {

      modal.classList.remove(
        'show'
      );

    }
  );


  modal.addEventListener(
    'click',
    event => {

      if (
        event.target ===
        modal
      ) {

        modal.classList.remove(
          'show'
        );

      }

    }
  );


  return modal;

}


/* =========================================================
   OPEN WISHLIST
========================================================= */

async function openWishlist() {

  accountMenu?.classList.remove(
    'show'
  );


  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) {

    if (authMessage) {

      authMessage.textContent =
        'Please log in to view your wishlist.';

    }

    authModal?.classList.add(
      'show'
    );

    return;

  }


  const modal =
    createWishlistModal();


  modal.classList.add(
    'show'
  );


  await loadWishlistItems();

}


/* =========================================================
   LOAD WISHLIST ITEMS
========================================================= */

async function loadWishlistItems() {

  const wishlistItems =
    document.getElementById(
      'wishlistItems'
    );


  if (!wishlistItems) return;


  wishlistItems.innerHTML =
    '<p>Loading wishlist...</p>';


  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) {

    wishlistItems.innerHTML =
      '<p>Please log in to view your wishlist.</p>';

    return;

  }


  const {
    data,
    error
  } = await supabase
    .from('wishlist')
    .select(`
      id,
      product_id,
      products (
        name,
        price,
        image_url,
        stock
      )
    `)
    .eq('user_id', user.id);


  if (error) {

    console.error(
      'Wishlist error:',
      error
    );

    wishlistItems.innerHTML =
      `<p>Unable to load your wishlist.</p>`;

    return;

  }


  if (
    !data ||
    data.length === 0
  ) {

    wishlistItems.innerHTML = `

      <div
        style="
          text-align:center;
          padding:35px 15px;
        ">

        <div style="font-size:55px;">
          ♡
        </div>

        <h3>
          Your wishlist is empty
        </h3>

        <p>
          Tap the heart on any product to save it here.
        </p>

      </div>

    `;

    return;

  }


  wishlistItems.innerHTML =
    '';


  data.forEach(
    item => {

      const product =
        item.products;


      if (!product) return;


      const image =
        product.image_url ||
        fallbackImage;


      const stock =
        numberValue(
          product.stock
        );


      wishlistItems.innerHTML += `

        <div
          class="wishlist-item"
          style="
            display:flex;
            align-items:center;
            gap:14px;
            padding:14px 0;
            border-bottom:1px solid #eee;
          ">

          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(product.name)}"
            style="
              width:80px;
              height:80px;
              object-fit:cover;
              border-radius:10px;
              background:#f5f5f5;
            "
            onerror="
              this.onerror=null;
              this.src='${fallbackImage}';
            "
          >


          <div
            style="
              flex:1;
              min-width:0;
            ">

            <h4
              style="
                margin:0 0 6px;
                font-size:16px;
              "
            >
              ${escapeHtml(product.name)}
            </h4>


            <p
              style="
                margin:0 0 8px;
                font-weight:700;
                color:#ff7900;
              "
            >
              GH₵ ${numberValue(
                product.price
              ).toFixed(2)}
            </p>


            <p
              style="
                margin:0;
                font-size:12px;
                color:${
                  stock > 0
                    ? '#16803c'
                    : '#d00'
                };
              "
            >
              ${
                stock > 0
                  ? `${stock} available`
                  : 'Out of stock'
              }
            </p>

          </div>


          <div
            style="
              display:flex;
              flex-direction:column;
              gap:6px;
            ">

            <button
              class="wishlist-cart-btn"
              data-product-id="${escapeHtml(product.id)}"
              ${
                stock <= 0
                  ? 'disabled'
                  : ''
              }
              style="
                border:none;
                border-radius:7px;
                background:${
                  stock > 0
                    ? '#ff7900'
                    : '#ccc'
                };
                color:white;
                padding:8px 10px;
                cursor:${
                  stock > 0
                    ? 'pointer'
                    : 'not-allowed'
                };
                font-size:12px;
              "
            >
              ${
                stock > 0
                  ? 'Add to Cart'
                  : 'Out of Stock'
              }
            </button>


            <button
              class="wishlist-remove-btn"
              data-product-id="${escapeHtml(product.id)}"
              style="
                border:1px solid #ddd;
                border-radius:7px;
                background:white;
                color:#d00;
                padding:7px 10px;
                cursor:pointer;
                font-size:12px;
              "
            >
              Remove
            </button>

          </div>

        </div>

      `;

    }
  );


  /* =====================================================
     ADD TO CART
  ===================================================== */

  document
    .querySelectorAll(
      '.wishlist-cart-btn'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            if (button.disabled) {
              return;
            }


            await addToCart(
              button.dataset.productId,
              1
            );

          }
        );

      }
    );


  /* =====================================================
     REMOVE
  ===================================================== */

  document
    .querySelectorAll(
      '.wishlist-remove-btn'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const success =
              await toggleWishlist(
                button.dataset.productId
              );


            if (success) {

              await loadWishlistItems();

            }

          }
        );

      }
    );

}


/* =========================================================
   WISHLIST ACCOUNT BUTTON
========================================================= */

wishlistBtn?.addEventListener(
  'click',
  async () => {

    await openWishlist();

  }
);


/* =========================================================
   HEADER WISHLIST BUTTON
========================================================= */

const headerWishlistBtn =
  document.getElementById(
    'headerWishlistBtn'
  );


headerWishlistBtn?.addEventListener(
  'click',
  async () => {

    await openWishlist();

  }
);


/* =========================================================
   CART BUTTON
========================================================= */

cartBtn?.addEventListener(
  'click',
  async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      if (authMessage) {

        authMessage.textContent =
          'Please log in to view your cart.';

      }

      authModal?.classList.add(
        'show'
      );

      return;

    }


    cartModal?.classList.add(
      'show'
    );


    await loadCart();

  }
);


/* =========================================================
   CLOSE CART
========================================================= */

closeCart?.addEventListener(
  'click',
  () => {

    cartModal?.classList.remove(
      'show'
    );

  }
);


/* =========================================================
   LOAD CART
========================================================= */

async function loadCart() {

  if (!cartItemsContainer) return;


  cartItemsContainer.innerHTML =
    '<p>Loading cart...</p>';


  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) {

    cartItemsContainer.innerHTML =
      '<p>Please log in.</p>';

    return;

  }


  const {
    data,
    error
  } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      product_id,
      products (
        name,
        price,
        image_url,
        stock
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', {
      ascending: false
    });


  if (error) {

    console.error(
      'Cart error:',
      error
    );

    cartItemsContainer.innerHTML =
      '<p>Unable to load your cart.</p>';

    return;

  }


  if (
    !data ||
    data.length === 0
  ) {

    cartItemsContainer.innerHTML =
      '<p>Your cart is empty.</p>';


    if (cartTotal) {

      cartTotal.textContent =
        'GH₵ 0.00';

    }

    return;

  }


  let total = 0;


  cartItemsContainer.innerHTML =
    '';


  data.forEach(
    item => {

      const product =
        item.products;


      if (!product) return;


      const itemTotal =
        numberValue(
          product.price
        ) *
        Number(
          item.quantity
        );


      total +=
        itemTotal;


      const image =
        product.image_url ||
        fallbackImage;


      cartItemsContainer.innerHTML += `

        <div class="cart-item">

          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(product.name)}"
            onerror="
              this.onerror=null;
              this.src='${fallbackImage}';
            "
          >


          <div class="cart-item-info">

            <h4>
              ${escapeHtml(product.name)}
            </h4>


            <div class="cart-item-price">
              GH₵ ${numberValue(
                product.price
              ).toFixed(2)}
            </div>


            <div class="cart-controls">

              <button
                class="quantity-minus"
                data-id="${escapeHtml(item.id)}"
                data-quantity="${item.quantity}"
                type="button"
              >
                −
              </button>


              <span>
                ${item.quantity}
              </span>


              <button
                class="quantity-plus"
                data-id="${escapeHtml(item.id)}"
                data-quantity="${item.quantity}"
                data-stock="${product.stock}"
                type="button"
              >
                +
              </button>


              <button
                class="remove-cart"
                data-id="${escapeHtml(item.id)}"
                type="button"
              >
                Remove
              </button>

            </div>

          </div>

        </div>

      `;

    }
  );


  if (cartTotal) {

    cartTotal.textContent =
      `GH₵ ${total.toFixed(2)}`;

  }


  addCartControls();

}


/* =========================================================
   CART CONTROLS
========================================================= */

function addCartControls() {

  document
    .querySelectorAll(
      '.quantity-minus'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const id =
              button.dataset.id;

            const quantity =
              Number(
                button.dataset.quantity
              );


            if (quantity <= 1) {

              await removeCartItem(
                id
              );

            } else {

              await updateCartItem(
                id,
                quantity - 1
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      '.quantity-plus'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const id =
              button.dataset.id;

            const quantity =
              Number(
                button.dataset.quantity
              );

            const stock =
              Number(
                button.dataset.stock
              );


            if (stock <= 0) {

              alert(
                'This product is out of stock.'
              );

              return;

            }


            if (quantity >= stock) {

              alert(
                'You have reached the available stock.'
              );

              return;

            }


            await updateCartItem(
              id,
              quantity + 1
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      '.remove-cart'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            await removeCartItem(
              button.dataset.id
            );

          }
        );

      }
    );

}


/* =========================================================
   UPDATE CART ITEM
========================================================= */

async function updateCartItem(
  id,
  quantity
) {

  const {
    error
  } = await supabase
    .from('cart_items')
    .update({
      quantity
    })
    .eq('id', id);


  if (error) {

    console.error(
      'Cart update error:',
      error
    );

    alert(
      `Could not update cart.\n\n${error.message}`
    );

    return;

  }


  await loadCart();

  await updateCartCount();

}


/* =========================================================
   REMOVE CART ITEM
========================================================= */

async function removeCartItem(
  id
) {

  const {
    error
  } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', id);


  if (error) {

    console.error(
      'Cart delete error:',
      error
    );

    alert(
      `Could not remove item.\n\n${error.message}`
    );

    return;

  }


  await loadCart();

  await updateCartCount();

}


/* =========================================================
   OPEN CHECKOUT
========================================================= */

checkoutBtn?.addEventListener(
  'click',
  async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      cartModal?.classList.remove(
        'show'
      );

      authModal?.classList.add(
        'show'
      );

      if (authMessage) {

        authMessage.textContent =
          'Please log in before checking out.';

      }

      return;

    }


    await prepareCheckout();

  }
);


/* =========================================================
   PREPARE CHECKOUT
========================================================= */

async function prepareCheckout() {

  if (checkoutMessage) {

    checkoutMessage.textContent =
      '';

  }


  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) return;


  const {
    data: profile
  } = await supabase
    .from('profiles')
    .select(
      'full_name, phone'
    )
    .eq('id', user.id)
    .maybeSingle();


  deliveryName.value =
    profile?.full_name ||
    '';


  deliveryPhone.value =
    profile?.phone ||
    '';


  const {
    data: cartItems,
    error
  } = await supabase
    .from('cart_items')
    .select(`
      quantity,
      products (
        name,
        price,
        stock
      )
    `)
    .eq('user_id', user.id);


  if (error) {

    console.error(
      'Checkout cart error:',
      error
    );

    alert(
      'Unable to prepare checkout.'
    );

    return;

  }


  if (
    !cartItems ||
    cartItems.length === 0
  ) {

    alert(
      'Your cart is empty.'
    );

    return;

  }


  let total = 0;


  cartItems.forEach(
    item => {

      if (item.products) {

        total +=
          numberValue(
            item.products.price
          ) *
          Number(
            item.quantity
          );

      }

    }
  );


  checkoutTotal.textContent =
    `GH₵ ${total.toFixed(2)}`;


  cartModal?.classList.remove(
    'show'
  );

  checkoutModal?.classList.add(
    'show'
  );

}


/* =========================================================
   CLOSE CHECKOUT
========================================================= */

closeCheckout?.addEventListener(
  'click',
  () => {

    checkoutModal?.classList.remove(
      'show'
    );

  }
);


/* =========================================================
   PLACE ORDER + PAYSTACK
========================================================= */

placeOrderBtn?.addEventListener(
  'click',
  async () => {

    const name =
      deliveryName.value.trim();

    const phone =
      deliveryPhone.value.trim();

    const address =
      deliveryAddress.value.trim();

    const city =
      deliveryCity.value.trim();


    if (
      !name ||
      !phone ||
      !address ||
      !city
    ) {

      checkoutMessage.textContent =
        'Please complete all delivery details.';

      return;

    }


    placeOrderBtn.disabled =
      true;

    placeOrderBtn.textContent =
      'Preparing Payment...';


    checkoutMessage.textContent =
      '';


    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      checkoutMessage.textContent =
        'Please log in again.';


      placeOrderBtn.disabled =
        false;

      placeOrderBtn.textContent =
        'Pay with Paystack';

      return;

    }


    /* =====================================================
       GET CART
    ===================================================== */

    const {
      data: cartItems,
      error: cartError
    } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_id,
        products (
          name,
          price,
          stock
        )
      `)
      .eq('user_id', user.id);


    if (cartError) {

      console.error(
        cartError
      );

      checkoutMessage.textContent =
        'Could not load your cart.';


      placeOrderBtn.disabled =
        false;

      placeOrderBtn.textContent =
        'Pay with Paystack';

      return;

    }


    if (
      !cartItems ||
      cartItems.length === 0
    ) {

      checkoutMessage.textContent =
        'Your cart is empty.';


      placeOrderBtn.disabled =
        false;

      placeOrderBtn.textContent =
        'Pay with Paystack';

      return;

    }


    /* =====================================================
       CALCULATE TOTAL
    ===================================================== */

    let total = 0;


    for (
      const item of cartItems
    ) {

      if (!item.products) {
        continue;
      }


      const stock =
        numberValue(
          item.products.stock
        );

      const quantity =
        Number(
          item.quantity
        );


      if (quantity > stock) {

        checkoutMessage.textContent =
          `${item.products.name} does not have enough stock.`;


        placeOrderBtn.disabled =
          false;

        placeOrderBtn.textContent =
          'Pay with Paystack';

        return;

      }


      total +=
        numberValue(
          item.products.price
        ) *
        quantity;

    }


    /* =====================================================
       UNIQUE PAYMENT REFERENCE
    ===================================================== */

    const reference =
      `SYBER-${Date.now()}-${user.id.slice(0, 8)}`;


    /* =====================================================
       CREATE PENDING ORDER
    ===================================================== */

    const {
      data: order,
      error: orderError
    } = await supabase
      .from('orders')
      .insert({

        user_id:
          user.id,

        total_amount:
          total,

        status:
          'pending',

        payment_status:
          'pending',

        payment_method:
          'paystack',

        payment_reference:
          reference,

        delivery_name:
          name,

        delivery_phone:
          phone,

        delivery_address:
          address,

        delivery_city:
          city

      })
      .select()
      .single();


    if (orderError) {

      console.error(
        'Order creation error:',
        orderError
      );

      checkoutMessage.textContent =
        `Could not create your order.\n${orderError.message}`;


      placeOrderBtn.disabled =
        false;

      placeOrderBtn.textContent =
        'Pay with Paystack';

      return;

    }


    /* =====================================================
       CREATE ORDER ITEMS
    ===================================================== */

    const orderItems =
      cartItems
        .filter(
          item =>
            item.products
        )
        .map(
          item => ({

            order_id:
              order.id,

            product_id:
              item.product_id,

            product_name:
              item.products.name,

            quantity:
              item.quantity,

            unit_price:
              item.products.price

          })
        );


    const {
      error: orderItemsError
    } = await supabase
      .from('order_items')
      .insert(
        orderItems
      );


    if (orderItemsError) {

      console.error(
        'Order items error:',
        orderItemsError
      );

      checkoutMessage.textContent =
        `Could not save your order items.\n${orderItemsError.message}`;


      placeOrderBtn.disabled =
        false;

      placeOrderBtn.textContent =
        'Pay with Paystack';

      return;

    }


    /* =====================================================
       PAYSTACK FUNCTION
    ===================================================== */

    const {
      data: payment,
      error: paymentError
    } = await supabase.functions.invoke(
      'paystack-payment',
      {

        body: {

          email:
            user.email,

          amount:
            total,

          reference,

          callback_url:
            window.location.href

        }

      }
    );


    if (paymentError) {

      console.error(
        'Paystack function error:',
        paymentError
      );

      checkoutMessage.textContent =
        'Unable to start Paystack payment.';


      placeOrderBtn.disabled =
        false;

      placeOrderBtn.textContent =
        'Pay with Paystack';

      return;

    }


    if (
      !payment ||
      !payment.status ||
      !payment.data?.authorization_url
    ) {

      console.error(
        'Invalid Paystack response:',
        payment
      );

      checkoutMessage.textContent =
        payment?.message ||
        'Paystack could not start the payment.';


      placeOrderBtn.disabled =
        false;

      placeOrderBtn.textContent =
        'Pay with Paystack';

      return;

    }

// ===============================
// MOBILE MONEY PAYMENT
// ===============================

const paymentMethod =
  document.querySelector(
    'input[name="paymentMethod"]:checked'
  )?.value;

if (paymentMethod === 'mobile_money') {

  const network =
    document.getElementById(
      'mobileMoneyNetwork'
    )?.value;

  const reference =
    document.getElementById(
      'mobileMoneyReference'
    )?.value.trim();

  if (!reference) {

    checkoutMessage.textContent =
      'Please enter your Mobile Money transaction/reference ID.';

    placeOrderBtn.disabled = false;

    placeOrderBtn.textContent =
      'Place Order';

    return;
  }

  // Keep the order as pending until the admin
  // manually verifies the Mobile Money payment.

  const {
    error: momoError
  } = await supabase
    .from('orders')
    .update({
      payment_method: 'mobile_money',
      payment_status: 'pending_verification',
      payment_reference: reference
    })
    .eq('id', order.id)
    .eq('user_id', user.id);

  if (momoError) {

    console.error(
      'Mobile Money update error:',
      momoError
    );

    checkoutMessage.textContent =
      'Your order was created, but we could not save the Mobile Money details.';

    placeOrderBtn.disabled = false;

    placeOrderBtn.textContent =
      'Place Order';

    return;
  }

  checkoutMessage.textContent =
    `Order received. Please send GH₵ ${total.toFixed(2)} via ${network} and wait for payment verification.`;

  placeOrderBtn.disabled = false;

  placeOrderBtn.textContent =
    'Place Order';

  return;
}
    /* =====================================================
       REDIRECT TO PAYSTACK
    ===================================================== */

    window.location.href =
      payment.data.authorization_url;

  }
);


/* =========================================================
   MOBILE BOTTOM NAVIGATION
========================================================= */

function setBottomNavActive(
  button
) {

  document
    .querySelectorAll(
      '.bottom-nav-item'
    )
    .forEach(
      item => {

        item.classList.remove(
          'active'
        );

      }
    );


  if (button) {

    button.classList.add(
      'active'
    );

  }

}


/* =========================================================
   HOME
========================================================= */

bottomHomeBtn?.addEventListener(
  'click',
  () => {

    setBottomNavActive(
      bottomHomeBtn
    );


    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }
);


/* =========================================================
   CATEGORIES
========================================================= */

bottomCategoriesBtn?.addEventListener(
  'click',
  () => {

    setBottomNavActive(
      bottomCategoriesBtn
    );


    if (categoriesContainer) {

      categoriesContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    }

  }
);


/* =========================================================
   CART
========================================================= */

bottomCartBtn?.addEventListener(
  'click',
  () => {

    setBottomNavActive(
      bottomCartBtn
    );


    cartBtn?.click();

  }
);


/* =========================================================
   WISHLIST
========================================================= */

bottomWishlistBtn?.addEventListener(
  'click',
  async () => {

    setBottomNavActive(
      bottomWishlistBtn
    );


    await openWishlist();

  }
);


/* =========================================================
   ACCOUNT
========================================================= */

bottomAccountBtn?.addEventListener(
  'click',
  () => {

    setBottomNavActive(
      bottomAccountBtn
    );


    loginBtn?.click();

  }
);


/* =========================================================
   EXTRA HOME / HERO BUTTONS
========================================================= */

const logoHomeBtn =
  document.getElementById(
    'logoHomeBtn'
  );

const homeNavBtn =
  document.getElementById(
    'homeNavBtn'
  );

const heroShopBtn =
  document.getElementById(
    'heroShopBtn'
  );

const heroDealsBtn =
  document.getElementById(
    'heroDealsBtn'
  );

const allCategoriesBtn =
  document.getElementById(
    'allCategoriesBtn'
  );

const viewAllCategoriesBtn =
  document.getElementById(
    'viewAllCategoriesBtn'
  );

const viewAllProductsBtn =
  document.getElementById(
    'viewAllProductsBtn'
  );


function goHome() {

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}


function goToProducts() {

  document
    .getElementById(
      'productsSection'
    )
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

}


function goToCategories() {

  document
    .getElementById(
      'categoriesSection'
    )
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

}


logoHomeBtn?.addEventListener(
  'click',
  event => {

    event.preventDefault();

    goHome();

  }
);


homeNavBtn?.addEventListener(
  'click',
  event => {

    event.preventDefault();

    goHome();

  }
);


heroShopBtn?.addEventListener(
  'click',
  goToProducts
);


heroDealsBtn?.addEventListener(
  'click',
  goToProducts
);


allCategoriesBtn?.addEventListener(
  'click',
  goToCategories
);


viewAllCategoriesBtn?.addEventListener(
  'click',
  goToCategories
);


viewAllProductsBtn?.addEventListener(
  'click',
  goToProducts
);


/* =========================================================
   AUTH STATE
========================================================= */

supabase.auth.onAuthStateChange(
  () => {

    setTimeout(
      async () => {

        await updateAuthButton();

        await updateCartCount();

        await loadWishlistIds();

      },
      0
    );

  }
);


/* =========================================================
   START WEBSITE
========================================================= */

async function startWebsite() {

  await loadCategories();

  await loadProducts();

  await loadWishlistIds();

  await updateAuthButton();

  await updateCartCount();

}


startWebsite();


/* =========================================================
   PAYSTACK PAYMENT CALLBACK
========================================================= */

async function handlePaystackCallback() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const reference =
    params.get('reference');


  if (!reference) {

    return;

  }


  console.log(
    'Paystack reference detected:',
    reference
  );


  /* =====================================================
     REMOVE REFERENCE FROM URL
  ===================================================== */

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );


  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) {

    alert(
      'Please log in again to verify your payment.'
    );

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabase.functions.invoke(
        'paystack-verify',
        {

          body: {
            reference
          }

        }
      );


    if (error) {

      console.error(
        'Payment verification error:',
        error
      );

      alert(
        'We could not verify your payment. Please contact SYBER MART.'
      );

      return;

    }


    console.log(
      'Payment verification result:',
      data
    );


    if (
      data?.paid === true
    ) {

      /* =================================================
         CLEAR CART
      ================================================= */

      const {
        error: cartError
      } = await supabase
        .from('cart_items')
        .delete()
        .eq(
          'user_id',
          user.id
        );


      if (cartError) {

        console.error(
          'Cart clearing error:',
          cartError
        );

      }


      await updateCartCount();


      alert(
        `Payment successful! 🎉\n\nYour SYBER MART order #${
          data.order_number ||
          data.order_id
        } has been confirmed.`
      );


      ordersModal?.classList.add(
        'show'
      );


      await loadOrders();


    } else {

      alert(
        'Payment has not been completed yet. Your order remains pending.'
      );

    }


  } catch (error) {

    console.error(
      'Payment callback error:',
      error
    );


    alert(
      'Something went wrong while checking your payment.'
    );

  }

}


handlePaystackCallback();
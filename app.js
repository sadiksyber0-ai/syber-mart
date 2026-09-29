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
   LOAD CATEGORIES
========================================================= */

async function loadCategories() {

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {

    console.error('Category error:', error);

    categoriesContainer.innerHTML =
      '<p>Unable to load categories.</p>';

    return;
  }

  categoriesContainer.innerHTML = `
    <button class="category" data-category="all">
      All Products
    </button>
  `;

  data.forEach(category => {

    categoriesContainer.innerHTML += `
      <button
        class="category"
        data-category="${category.id}">
        ${category.name}
      </button>
    `;

  });

  document
    .querySelectorAll('.category')
    .forEach(button => {

      button.addEventListener('click', () => {

        const categoryId =
          button.dataset.category;

        if (categoryId === 'all') {

          displayProducts(allProducts);

        } else {

          const filtered =
            allProducts.filter(
              product =>
                String(product.category_id) ===
                categoryId
            );

          displayProducts(filtered);

        }

      });

    });

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

  productsContainer.innerHTML =
    '<p>Loading products...</p>';

  const { data, error } = await supabase
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

    console.error('Product error:', error);

    productsContainer.innerHTML =
      '<p>Unable to load products. Check the browser console.</p>';

    return;
  }

  allProducts = data || [];

  displayProducts(allProducts);

}


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function displayProducts(products) {

  productCount.textContent =
    `${products.length} product${products.length === 1 ? '' : 's'}`;

  if (products.length === 0) {

    productsContainer.innerHTML =
      '<p>No products found.</p>';

    return;
  }

  productsContainer.innerHTML = '';

  products.forEach(product => {

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

const image =
  product.image_url || fallbackImage;

    productsContainer.innerHTML += `

      <article class="product">

        <img
  class="product-image"
  src="${image}"
  alt="${product.name}"
  onerror="this.onerror=null; this.src='${fallbackImage}';"
>

        <div class="product-info">

          <h3 class="product-name">
            ${product.name}
          </h3>

          <p class="product-price">
            GH₵ ${Number(product.price).toFixed(2)}
          </p>

          <button
            class="add-cart"
            data-product-id="${product.id}">
            Add to Cart
          </button>

        </div>

      </article>

    `;

  });

  document
    .querySelectorAll('.add-cart')
    .forEach(button => {

      button.addEventListener('click', () => {

        addToCart(
          button.dataset.productId
        );

      });

    });

}


/* =========================================================
   SEARCH
========================================================= */

function searchProducts() {

  const searchTerm =
    searchInput.value.trim().toLowerCase();

  if (!searchTerm) {

    displayProducts(allProducts);

    return;
  }

  const results =
    allProducts.filter(product => {

      const name =
        product.name?.toLowerCase() || '';

      const description =
        product.description?.toLowerCase() || '';

      const brand =
        product.brand?.toLowerCase() || '';

      return (
        name.includes(searchTerm) ||
        description.includes(searchTerm) ||
        brand.includes(searchTerm)
      );

    });

  displayProducts(results);

}


searchBtn.addEventListener(
  'click',
  searchProducts
);


searchInput.addEventListener(
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

async function addToCart(productId) {

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {

    authModal.classList.add('show');

    authMessage.textContent =
      'Please log in to add products to your cart.';

    return;
  }

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

    console.error(existingError);

    alert('Could not check your cart.');

    return;
  }

  if (existing) {

    const { error } = await supabase
      .from('cart_items')
      .update({
        quantity: existing.quantity + 1
      })
      .eq('id', existing.id);

    if (error) {

      console.error(error);

      alert('Could not update your cart.');

      return;
    }

  } else {

    const { error } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id: productId,
        quantity: 1
      });

    if (error) {

      console.error(error);

      alert('Could not add product to cart.');

      return;
    }

  }

  await updateCartCount();

  alert('Product added to cart!');

}


/* =========================================================
   CART COUNT
========================================================= */

async function updateCartCount() {

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {

    cartCount.textContent = '0';

    return;
  }

  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', user.id);

  if (error) {

    console.error(error);

    return;
  }

  const count =
    data.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  cartCount.textContent = count;

}


/* =========================================================
   LOGIN / ACCOUNT BUTTON
========================================================= */

loginBtn.addEventListener(
  'click',
  async event => {

    event.stopPropagation();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {

      accountMenu.classList.remove('show');

      authMessage.textContent = '';

      authModal.classList.add('show');

      return;
    }

    await loadAccount();

    accountMenu.classList.toggle('show');

  }
);


/* =========================================================
   BECOME SELLER FROM ACCOUNT MENU
========================================================= */

if (becomeSellerBtn) {

  becomeSellerBtn.addEventListener(
    'click',
    async () => {

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {

        alert('Please log in first.');

        return;
      }


      /* CHECK CURRENT ROLE */

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


      /* ALREADY SELLER */

      if (profile?.role === 'seller') {

        window.location.href =
          'seller.html';

        return;
      }


      /* ADMIN */

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

      if (!confirmed) return;


      becomeSellerBtn.disabled = true;

      becomeSellerBtn.textContent =
        'Setting up seller account...';


      const { error } =
        await supabase.rpc(
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

        becomeSellerBtn.disabled = false;

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

}


/* =========================================================
   CLOSE LOGIN MODAL
========================================================= */

closeAuth.addEventListener(
  'click',
  () => {

    authModal.classList.remove('show');

  }
);


/* =========================================================
   SWITCH LOGIN / CUSTOMER SIGNUP
========================================================= */

switchAuth.addEventListener(
  'click',
  () => {

    sellerSignupMode = false;

    signupMode = !signupMode;

    if (signupMode) {

      authTitle.textContent =
        'Create SYBER MART Account';

      nameField.style.display =
        'block';

      fullName.required = true;

      authSubmit.textContent =
        'Create Account';

      switchAuth.textContent =
        'Already have an account? Login';

    } else {

      authTitle.textContent =
        'Login to SYBER MART';

      nameField.style.display =
        'none';

      fullName.required = false;

      authSubmit.textContent =
        'Login';

      switchAuth.textContent =
        "Don't have an account? Create one";

    }

    authMessage.textContent = '';

  }
);


/* =========================================================
   SELLER SIGNUP BUTTON
========================================================= */

if (sellerSignupBtn) {

  sellerSignupBtn.addEventListener(
    'click',
    () => {

      sellerSignupMode = true;

      signupMode = true;


      authTitle.textContent =
        'Become a Seller';


      authSubmit.textContent =
        'Create Seller Account';


      nameField.style.display =
        'block';

      fullName.required = true;


      switchAuth.textContent =
        'Already have an account? Login';


      authMessage.textContent =
        'Create your seller account to start selling on SYBER MART.';


      authModal.classList.add('show');

    }
  );

}


/* =========================================================
   LOGIN / SIGNUP SUBMIT
========================================================= */

authForm.addEventListener(
  'submit',
  async event => {

    event.preventDefault();

    authMessage.textContent =
      'Please wait...';

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    /* ===============================
       SIGNUP
    =============================== */

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


      /* ===============================
         SELLER SIGNUP
      =============================== */

      if (sellerSignupMode) {

        if (!data.session) {

          authMessage.textContent =
            '✅ Seller account created. Please confirm your email, then log in to activate your seller account.';

          sellerSignupMode = false;
          signupMode = false;

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


        sellerSignupMode = false;
        signupMode = false;


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


      /* ===============================
         NORMAL CUSTOMER SIGNUP
      =============================== */

      authMessage.textContent =
        'Account created successfully. Check your email if confirmation is required.';

      signupMode = false;


      nameField.style.display =
        'none';

      fullName.required = false;


      authTitle.textContent =
        'Login to SYBER MART';


      authSubmit.textContent =
        'Login';


      switchAuth.textContent =
        "Don't have an account? Create one";


      return;
    }


    /* ===============================
       LOGIN
    =============================== */

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

        authModal.classList.remove('show');

        authForm.reset();

        await updateAuthButton();

        await updateCartCount();

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

    loginBtn.textContent =
      'Account';

  } else {

    loginBtn.textContent =
      'Login';

    accountMenu.classList.remove(
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


  accountEmail.textContent =
    user.email || '';


  const metadataName =
    user.user_metadata?.full_name;


  accountName.textContent =
    metadataName || 'My Account';


  const {
    data: profile,
    error
  } = await supabase
    .from('profiles')
    .select('full_name, phone, role')
    .eq('id', user.id)
    .maybeSingle();


  if (!error && profile?.full_name) {

    accountName.textContent =
      profile.full_name;

  }

}


/* =========================================================
   LOG OUT
========================================================= */

logoutBtn.addEventListener(
  'click',
  async event => {

    event.stopPropagation();

    const { error } =
      await supabase.auth.signOut();

    if (error) {

      console.error(error);

      alert('Unable to log out.');

      return;
    }

    accountMenu.classList.remove(
      'show'
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

profileBtn.addEventListener(
  'click',
  async () => {

    accountMenu.classList.remove(
      'show'
    );


    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();


    if (userError || !user) {

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
      .select('full_name, phone')
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
      profile?.phone || '';


    profileMessage.textContent =
      '';


    profileModal.classList.add(
      'show'
    );

  }
);


/* =========================================================
   CLOSE PROFILE
========================================================= */

closeProfile.addEventListener(
  'click',
  () => {

    profileModal.classList.remove(
      'show'
    );

  }
);


/* =========================================================
   SAVE PROFILE
========================================================= */

saveProfileBtn.addEventListener(
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


    const { error } =
      await supabase.rpc(
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


    accountName.textContent =
      name;


    saveProfileBtn.disabled =
      false;

    saveProfileBtn.textContent =
      'Save Changes';

  }
);


/* =========================================================
   MY ORDERS
========================================================= */

ordersBtn.addEventListener(
  'click',
  async () => {

    accountMenu.classList.remove(
      'show'
    );

    ordersModal.classList.add(
      'show'
    );

    await loadOrders();

  }
);


closeOrders.addEventListener(
  'click',
  () => {

    ordersModal.classList.remove(
      'show'
    );

  }
);


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

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


  orders.forEach(order => {

    const date =
      new Date(
        order.created_at
      ).toLocaleDateString();


    ordersList.innerHTML += `
      <div class="order-card">

        <div class="order-header">

          <strong>
            Order #${order.order_number || order.id}
          </strong>

          <span>
            ${date}
          </span>

        </div>


        <div class="order-details">

          <p>
            <strong>Total:</strong>
            GH₵ ${Number(
              order.total_amount
            ).toFixed(2)}
          </p>


          <p>
            <strong>Payment:</strong>
            ${order.payment_status}
          </p>


          <p>
            <strong>Status:</strong>
            ${order.status}
          </p>

        </div>

      </div>
    `;

  });

}


/* =========================================================
   WISHLIST
========================================================= */

wishlistBtn.addEventListener(
  'click',
  () => {

    accountMenu.classList.remove(
      'show'
    );

    alert(
      'Wishlist will be added next.'
    );

  }
);


/* =========================================================
   CART BUTTON
========================================================= */

cartBtn.addEventListener(
  'click',
  async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      authMessage.textContent =
        'Please log in to view your cart.';

      authModal.classList.add(
        'show'
      );

      return;
    }


    cartModal.classList.add(
      'show'
    );


    await loadCart();

  }
);


/* =========================================================
   CLOSE CART
========================================================= */

closeCart.addEventListener(
  'click',
  () => {

    cartModal.classList.remove(
      'show'
    );

  }
);


/* =========================================================
   LOAD CART
========================================================= */

async function loadCart() {

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

    cartTotal.textContent =
      'GH₵ 0.00';

    return;
  }


  let total = 0;


  cartItemsContainer.innerHTML =
    '';


  data.forEach(item => {

    const product =
      item.products;


    if (!product) return;


    const itemTotal =
      Number(product.price) *
      item.quantity;


    total += itemTotal;


    const image =
      product.image_url ||
      'https://via.placeholder.com/100?text=Product';


    cartItemsContainer.innerHTML += `

      <div class="cart-item">

        <img
          src="${image}"
          alt="${product.name}"
        >


        <div class="cart-item-info">

          <h4>
            ${product.name}
          </h4>


          <div class="cart-item-price">

            GH₵ ${Number(
              product.price
            ).toFixed(2)}

          </div>


          <div class="cart-controls">

            <button
              class="quantity-minus"
              data-id="${item.id}"
              data-quantity="${item.quantity}">
              −
            </button>


            <span>
              ${item.quantity}
            </span>


            <button
              class="quantity-plus"
              data-id="${item.id}"
              data-quantity="${item.quantity}"
              data-stock="${product.stock}">
              +
            </button>


            <button
              class="remove-cart"
              data-id="${item.id}">
              Remove
            </button>

          </div>

        </div>

      </div>

    `;

  });


  cartTotal.textContent =
    `GH₵ ${total.toFixed(2)}`;


  addCartControls();

}


/* =========================================================
   CART CONTROLS
========================================================= */

function addCartControls() {

  document
    .querySelectorAll('.quantity-minus')
    .forEach(button => {

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

            await removeCartItem(id);

          } else {

            await updateCartItem(
              id,
              quantity - 1
            );

          }

        }
      );

    });


  document
    .querySelectorAll('.quantity-plus')
    .forEach(button => {

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

    });


  document
    .querySelectorAll('.remove-cart')
    .forEach(button => {

      button.addEventListener(
        'click',
        async () => {

          await removeCartItem(
            button.dataset.id
          );

        }
      );

    });

}


/* =========================================================
   UPDATE CART ITEM
========================================================= */

async function updateCartItem(
  id,
  quantity
) {

  const { error } =
    await supabase
      .from('cart_items')
      .update({
        quantity
      })
      .eq('id', id);


  if (error) {

    console.error(error);

    alert(
      'Could not update cart.'
    );

    return;
  }


  await loadCart();

  await updateCartCount();

}


/* =========================================================
   REMOVE CART ITEM
========================================================= */

async function removeCartItem(id) {

  const { error } =
    await supabase
      .from('cart_items')
      .delete()
      .eq('id', id);


  if (error) {

    console.error(error);

    alert(
      'Could not remove item.'
    );

    return;
  }


  await loadCart();

  await updateCartCount();

}


/* =========================================================
   OPEN CHECKOUT
========================================================= */

checkoutBtn.addEventListener(
  'click',
  async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      cartModal.classList.remove(
        'show'
      );

      authModal.classList.add(
        'show'
      );

      authMessage.textContent =
        'Please log in before checking out.';

      return;
    }


    await prepareCheckout();

  }
);


/* =========================================================
   PREPARE CHECKOUT
========================================================= */

async function prepareCheckout() {

  checkoutMessage.textContent =
    '';


  const {
    data: { user }
  } = await supabase.auth.getUser();


  if (!user) return;


  const {
    data: profile
  } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle();


  deliveryName.value =
    profile?.full_name || '';


  deliveryPhone.value =
    profile?.phone || '';


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

    console.error(error);

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


  cartItems.forEach(item => {

    if (item.products) {

      total +=
        Number(
          item.products.price
        ) *
        Number(
          item.quantity
        );

    }

  });


  checkoutTotal.textContent =
    `GH₵ ${total.toFixed(2)}`;


  cartModal.classList.remove(
    'show'
  );

  checkoutModal.classList.add(
    'show'
  );

}


/* =========================================================
   CLOSE CHECKOUT
========================================================= */

closeCheckout.addEventListener(
  'click',
  () => {

    checkoutModal.classList.remove(
      'show'
    );

  }
);


/* =========================================================
   PLACE ORDER + PAYSTACK
========================================================= */

placeOrderBtn.addEventListener(
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


    /* GET CART */

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


    /* CALCULATE TOTAL */

    let total = 0;


    for (
      const item of cartItems
    ) {

      if (!item.products) continue;


      const stock =
        Number(
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
        Number(
          item.products.price
        ) *
        quantity;

    }


    /* UNIQUE PAYMENT REFERENCE */

    const reference =
      `SYBER-${Date.now()}-${user.id.slice(0, 8)}`;


    /* CREATE PENDING ORDER */

    const {
      data: order,
      error: orderError
    } = await supabase
      .from('orders')
      .insert({

        user_id: user.id,

        total_amount: total,

        status: 'pending',

        payment_status: 'pending',

        payment_method: 'paystack',

        payment_reference: reference,

        delivery_name: name,

        delivery_phone: phone,

        delivery_address: address,

        delivery_city: city

      })
      .select()
      .single();


    if (orderError) {

      console.error(
        'Order creation error:',
        orderError
      );

      checkoutMessage.textContent =
        'Could not create your order.';

      placeOrderBtn.disabled =
        false;

      placeOrderBtn.textContent =
        'Pay with Paystack';

      return;
    }


    /* CREATE ORDER ITEMS */

    const orderItems =
      cartItems
        .filter(
          item => item.products
        )
        .map(item => ({

          order_id: order.id,

          product_id:
            item.product_id,

          product_name:
            item.products.name,

          quantity:
            item.quantity,

          unit_price:
            item.products.price

        }));


    const {
      error: orderItemsError
    } = await supabase
      .from('order_items')
      .insert(orderItems);


    if (orderItemsError) {

      console.error(
        'Order items error:',
        orderItemsError
      );

      checkoutMessage.textContent =
        'Could not save your order items.';

      placeOrderBtn.disabled =
        false;

      placeOrderBtn.textContent =
        'Pay with Paystack';

      return;
    }


    /* CALL PAYSTACK FUNCTION */

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


    /* REDIRECT TO PAYSTACK */

    window.location.href =
      payment.data.authorization_url;

  }
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


  /* REMOVE REFERENCE FROM URL */

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


    if (data?.paid === true) {

      /* CLEAR CART */

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


      ordersModal.classList.add(
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
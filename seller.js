import { supabase } from './supabase.js';


// ===============================
// ELEMENTS
// ===============================

const sellerName = document.getElementById('sellerName');
const sellerMessage = document.getElementById('sellerMessage');
const logoutBtn = document.getElementById('logoutBtn');

const sellerProductForm = document.getElementById('sellerProductForm');
const productCategory = document.getElementById('productCategory');
const productMessage = document.getElementById('productMessage');

const productImageFile = document.getElementById('productImageFile');
const productImagePreview = document.getElementById('productImagePreview');

const sellerProductsList =
  document.getElementById('sellerProductsList');

const sellerOrdersList =
  document.getElementById('sellerOrdersList');

const productCount =
  document.getElementById('productCount');

const activeProductCount =
  document.getElementById('activeProductCount');

const orderCount =
  document.getElementById('orderCount');

const salesTotal =
  document.getElementById('salesTotal');


// ===============================
// IMAGE PREVIEW
// ===============================

if (productImageFile && productImagePreview) {

  productImageFile.addEventListener('change', () => {

    const file = productImageFile.files[0];

    if (!file) {
      productImagePreview.src = '';
      productImagePreview.style.display = 'none';
      return;
    }

    if (!file.type.startsWith('image/')) {

      alert('Please choose an image file.');

      productImageFile.value = '';
      productImagePreview.src = '';
      productImagePreview.style.display = 'none';

      return;
    }

    if (file.size > 5 * 1024 * 1024) {

      alert('Image is too large. Please choose an image under 5 MB.');

      productImageFile.value = '';
      productImagePreview.src = '';
      productImagePreview.style.display = 'none';

      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    productImagePreview.src = previewUrl;
    productImagePreview.style.display = 'block';

  });

}


// ===============================
// CHECK SELLER LOGIN
// ===============================

async function checkSeller() {

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {

    window.location.href = 'index.html';

    return null;
  }

  const {
    data: profile,
    error
  } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {

    sellerMessage.textContent =
      'Unable to load seller profile.';

    return null;
  }

  if (
    profile.role !== 'seller' &&
    profile.role !== 'admin'
  ) {

    sellerMessage.textContent =
      'You do not have permission to access the seller dashboard.';

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);

    return null;
  }

  sellerName.textContent =
    profile.full_name ||
    user.email ||
    'Seller';

  return user;
}


// ===============================
// LOAD CATEGORIES
// ===============================

async function loadCategories() {

  const {
    data: categories,
    error
  } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  if (error) {

    console.error(
      'Categories error:',
      error
    );

    productCategory.innerHTML =
      '<option value="">Unable to load categories</option>';

    return;
  }

  productCategory.innerHTML =
    '<option value="">Select category</option>';

  categories.forEach(category => {

    const option =
      document.createElement('option');

    option.value = category.id;

    option.textContent =
      category.name;

    productCategory.appendChild(option);

  });
}


// ===============================
// UPLOAD PRODUCT IMAGE
// ===============================

async function uploadProductImage(
  file,
  productId
) {

  if (!file) {
    return {
      url: null,
      error: new Error('No image selected.')
    };
  }

  if (!file.type.startsWith('image/')) {
    return {
      url: null,
      error: new Error(
        'Please select a valid image file.'
      )
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      url: null,
      error: new Error(
        'Image must be 5 MB or smaller.'
      )
    };
  }

  const fileExtension =
    file.name.includes('.')
      ? file.name
          .split('.')
          .pop()
          .toLowerCase()
      : 'jpg';

  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}.${fileExtension}`;

  const filePath =
    `products/${productId}/${fileName}`;

  const {
    error: uploadError
  } = await supabase.storage
    .from('product-images')
    .upload(
      filePath,
      file,
      {
        cacheControl: '3600',
        upsert: false
      }
    );

  if (uploadError) {

    console.error(
      'Image upload error:',
      uploadError
    );

    return {
      url: null,
      error: uploadError
    };
  }

  const {
    data: publicUrlData
  } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return {
    url: publicUrlData.publicUrl,
    error: null
  };
}


// ===============================
// LOAD SELLER PRODUCTS
// ===============================

async function loadSellerProducts(user) {

  sellerProductsList.innerHTML =
    '<p>Loading your products...</p>';

  const {
    data: products,
    error
  } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category_id,
      price,
      old_price,
      stock,
      image_url,
      brand,
      sku,
      description,
      is_active,
      created_at,
      categories (
        name
      )
    `)
    .eq('seller_id', user.id)
    .order(
      'created_at',
      { ascending: false }
    );

  if (error) {

    console.error(
      'Seller products error:',
      error
    );

    sellerProductsList.innerHTML =
      '<p>Unable to load your products.</p>';

    return;
  }

  productCount.textContent =
    products.length;

  activeProductCount.textContent =
    products.filter(
      product => product.is_active
    ).length;

  if (products.length === 0) {

    sellerProductsList.innerHTML = `
      <div style="text-align:center; padding:30px;">
        <p>You have not added any products yet.</p>
        <p>Add your first product using the form above.</p>
      </div>
    `;

    return;
  }

  sellerProductsList.innerHTML = '';

  products.forEach(product => {

    const card =
      document.createElement('div');

    card.style.cssText = `
      border:1px solid #ddd;
      border-radius:10px;
      padding:15px;
      margin-bottom:15px;
      display:flex;
      gap:15px;
      align-items:center;
      flex-wrap:wrap;
    `;

    card.innerHTML = `
      <img
        src="${product.image_url || ''}"
        alt="${product.name}"
        style="
          width:90px;
          height:90px;
          object-fit:cover;
          border-radius:8px;
          background:#eee;
        "
        onerror="this.style.display='none';"
      >

      <div style="flex:1; min-width:220px;">

        <h3 style="margin-bottom:6px;">
          ${product.name}
        </h3>

        <p>
          Category:
          ${product.categories?.name || 'Uncategorized'}
        </p>

        <p>
          Price:
          <strong>
            GH₵ ${Number(product.price).toFixed(2)}
          </strong>
        </p>

        <p>
          Stock:
          ${product.stock}
        </p>

        <p>
          Status:
          ${product.is_active
            ? '🟢 Active'
            : '🔴 Inactive'}
        </p>

      </div>

      <div style="
        display:flex;
        gap:8px;
        flex-wrap:wrap;
      ">

        <button
          class="admin-btn seller-toggle-btn"
          data-id="${product.id}"
          data-active="${product.is_active}"
        >
          ${
            product.is_active
              ? '⏸️ Deactivate'
              : '▶️ Activate'
          }
        </button>

        <button
          class="admin-btn seller-delete-btn"
          data-id="${product.id}"
          style="background:#c62828;"
        >
          🗑️ Delete
        </button>

      </div>
    `;

    sellerProductsList.appendChild(card);

  });


  // ===============================
  // TOGGLE PRODUCT
  // ===============================

  document
    .querySelectorAll('.seller-toggle-btn')
    .forEach(button => {

      button.addEventListener(
        'click',
        async () => {

          const productId =
            button.dataset.id;

          const currentlyActive =
            button.dataset.active === 'true';

          const {
            error
          } = await supabase
            .from('products')
            .update({
              is_active: !currentlyActive,
              updated_at:
                new Date().toISOString()
            })
            .eq('id', productId)
            .eq('seller_id', user.id);

          if (error) {

            alert(
              `Unable to update product: ${error.message}`
            );

            return;
          }

          await loadSellerProducts(user);

        }
      );

    });


  // ===============================
  // DELETE PRODUCT
  // ===============================

  document
    .querySelectorAll('.seller-delete-btn')
    .forEach(button => {

      button.addEventListener(
        'click',
        async () => {

          const productId =
            button.dataset.id;

          const confirmed =
            confirm(
              'Are you sure you want to delete this product?'
            );

          if (!confirmed) return;

          const {
            error
          } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('seller_id', user.id);

          if (error) {

            alert(
              `Unable to delete product: ${error.message}`
            );

            return;
          }

          alert(
            'Product deleted successfully.'
          );

          await loadSellerProducts(user);

        }
      );

    });

}


// ===============================
// ADD PRODUCT
// ===============================

sellerProductForm.addEventListener(
  'submit',
  async (event) => {

    event.preventDefault();

    productMessage.textContent = '';

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {

      productMessage.textContent =
        '❌ Please log in again.';

      return;
    }

    const name =
      document
        .getElementById('productName')
        .value
        .trim();

    const categoryId =
      productCategory.value;

    const price =
      Number(
        document
          .getElementById('productPrice')
          .value
      );

    const oldPriceValue =
      document
        .getElementById('productOldPrice')
        .value;

    const oldPrice =
      oldPriceValue === ''
        ? null
        : Number(oldPriceValue);

    const stock =
      Number(
        document
          .getElementById('productStock')
          .value
      );

    const brand =
      document
        .getElementById('productBrand')
        .value
        .trim();

    const sku =
      document
        .getElementById('productSKU')
        .value
        .trim();

    const description =
      document
        .getElementById('productDescription')
        .value
        .trim();


    // ===============================
    // VALIDATION
    // ===============================

    if (!name) {

      productMessage.textContent =
        '❌ Product name is required.';

      return;
    }

    if (!categoryId) {

      productMessage.textContent =
        '❌ Please select a category.';

      return;
    }

    if (!Number.isFinite(price) || price < 0) {

      productMessage.textContent =
        '❌ Please enter a valid price.';

      return;
    }

    if (
      oldPrice !== null &&
      (
        !Number.isFinite(oldPrice) ||
        oldPrice < 0
      )
    ) {

      productMessage.textContent =
        '❌ Please enter a valid old price.';

      return;
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {

      productMessage.textContent =
        '❌ Please enter a valid stock quantity.';

      return;
    }


    // ===============================
    // CHECK IMAGE
    // ===============================

    const imageFile =
      productImageFile?.files?.[0];

    if (!imageFile) {

      productMessage.textContent =
        '❌ Please choose a product image.';

      return;
    }

    if (!imageFile.type.startsWith('image/')) {

      productMessage.textContent =
        '❌ Please choose a valid image file.';

      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {

      productMessage.textContent =
        '❌ Image must be 5 MB or smaller.';

      return;
    }


    // ===============================
    // BUTTON
    // ===============================

    const saveButton =
      document.getElementById(
        'saveProductBtn'
      );

    saveButton.disabled = true;

    saveButton.textContent =
      'Saving product...';


    // ===============================
    // CREATE SLUG
    // ===============================

    const slug =
      name
        .toLowerCase()
        .trim()
        .replace(
          /[^a-z0-9]+/g,
          '-'
        )
        .replace(
          /^-+|-+$/g,
          ''
        )
        +
        '-' +
        Date.now();


    // ===============================
    // CREATE PRODUCT FIRST
    // ===============================

    const {
      data: newProduct,
      error: productError
    } = await supabase
      .from('products')
      .insert({
        seller_id: user.id,
        category_id: Number(categoryId),
        name: name,
        slug: slug,
        description:
          description || null,
        price: price,
        old_price: oldPrice,
        stock: stock,
        image_url: null,
        brand: brand || null,
        sku: sku || null,
        is_active: true
      })
      .select('id')
      .single();


    if (productError) {

      console.error(
        'Add product error:',
        productError
      );

      saveButton.disabled = false;

      saveButton.textContent =
        '➕ Add Product';

      productMessage.textContent =
        `❌ Unable to add product: ${productError.message}`;

      return;
    }


    // ===============================
    // UPLOAD IMAGE
    // ===============================

    saveButton.textContent =
      'Uploading image...';

    const {
      url: imageUrl,
      error: imageError
    } = await uploadProductImage(
      imageFile,
      newProduct.id
    );


    if (imageError) {

      console.error(
        'Product image error:',
        imageError
      );


      // Remove product if image upload fails
      await supabase
        .from('products')
        .delete()
        .eq('id', newProduct.id)
        .eq('seller_id', user.id);


      saveButton.disabled = false;

      saveButton.textContent =
        '➕ Add Product';

      productMessage.textContent =
        `❌ Image upload failed: ${imageError.message}`;

      return;
    }


    // ===============================
    // SAVE IMAGE URL
    // ===============================

    saveButton.textContent =
      'Finalizing product...';

    const {
      error: imageUpdateError
    } = await supabase
      .from('products')
      .update({
        image_url: imageUrl,
        updated_at:
          new Date().toISOString()
      })
      .eq('id', newProduct.id)
      .eq('seller_id', user.id);


    if (imageUpdateError) {

      console.error(
        'Image URL update error:',
        imageUpdateError
      );

      saveButton.disabled = false;

      saveButton.textContent =
        '➕ Add Product';

      productMessage.textContent =
        `❌ Product saved but image could not be attached: ${imageUpdateError.message}`;

      return;
    }


    // ===============================
    // SUCCESS
    // ===============================

    saveButton.disabled = false;

    saveButton.textContent =
      '➕ Add Product';

    productMessage.textContent =
      '✅ Product added successfully!';

    sellerProductForm.reset();


    if (productImagePreview) {

      productImagePreview.src = '';

      productImagePreview.style.display =
        'none';

    }


    await loadSellerProducts(user);

  }
);


// ===============================
// LOAD SELLER ORDERS
// ===============================

async function loadSellerOrders(user) {

  sellerOrdersList.innerHTML =
    '<p>Loading orders...</p>';

  const {
    data: orderItems,
    error
  } = await supabase
    .from('order_items')
    .select(`
      id,
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      orders (
        order_number,
        status,
        payment_status,
        created_at
      ),
      products (
        seller_id
      )
    `)
    .eq('products.seller_id', user.id)
    .order(
      'created_at',
      { ascending: false }
    );

  if (error) {

    console.error(
      'Seller orders error:',
      error
    );

    sellerOrdersList.innerHTML =
      '<p>Orders will appear here once customers purchase your products.</p>';

    orderCount.textContent = '0';

    salesTotal.textContent =
      'GH₵ 0.00';

    return;
  }

  if (
    !orderItems ||
    orderItems.length === 0
  ) {

    orderCount.textContent = '0';

    salesTotal.textContent =
      'GH₵ 0.00';

    sellerOrdersList.innerHTML = `
      <div style="text-align:center; padding:30px;">
        <p>📦 No orders for your products yet.</p>
      </div>
    `;

    return;
  }


  const orderIds =
    [
      ...new Set(
        orderItems.map(
          item => item.order_id
        )
      )
    ];

  orderCount.textContent =
    orderIds.length;


  let totalSales = 0;

  orderItems.forEach(item => {

    if (
      item.orders?.payment_status ===
      'paid'
    ) {

      totalSales +=
        Number(item.unit_price) *
        Number(item.quantity);

    }

  });

  salesTotal.textContent =
    `GH₵ ${totalSales.toFixed(2)}`;


  sellerOrdersList.innerHTML = '';

  orderItems.forEach(item => {

    const order = item.orders;

    const card =
      document.createElement('div');

    card.style.cssText = `
      border:1px solid #ddd;
      border-radius:10px;
      padding:15px;
      margin-bottom:15px;
    `;

    card.innerHTML = `
      <h3>
        Order #${
          order?.order_number ||
          item.order_id
        }
      </h3>

      <p>
        Product:
        <strong>
          ${item.product_name}
        </strong>
      </p>

      <p>
        Quantity:
        ${item.quantity}
      </p>

      <p>
        Amount:
        GH₵ ${
          (
            Number(item.unit_price) *
            Number(item.quantity)
          ).toFixed(2)
        }
      </p>

      <p>
        Payment:
        ${
          order?.payment_status ||
          'pending'
        }
      </p>

      <p>
        Order status:
        ${
          order?.status ||
          'pending'
        }
      </p>

      <p style="color:#777;">
        ${
          order?.created_at
            ? new Date(
                order.created_at
              ).toLocaleDateString()
            : ''
        }
      </p>
    `;

    sellerOrdersList.appendChild(card);

  });

}


// ===============================
// LOGOUT
// ===============================

logoutBtn.addEventListener(
  'click',
  async () => {

    await supabase.auth.signOut();

    window.location.href =
      'index.html';

  }
);


// ===============================
// START SELLER DASHBOARD
// ===============================

async function startSellerDashboard() {

  const user =
    await checkSeller();

  if (!user) return;

  await loadCategories();

  await loadSellerProducts(user);

  await loadSellerOrders(user);

}


startSellerDashboard();
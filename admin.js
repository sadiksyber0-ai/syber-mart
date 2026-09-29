import { supabase } from './supabase.js';


/* =========================================================
   ADMIN ELEMENTS
========================================================= */

const adminEmail =
  document.getElementById('adminEmail');

const productCount =
  document.getElementById('productCount');

const orderCount =
  document.getElementById('orderCount');

const customerCount =
  document.getElementById('customerCount');

const sellerCount =
  document.getElementById('sellerCount');


/* =========================================================
   ADD PRODUCT ELEMENTS
========================================================= */

const addProductBtn =
  document.getElementById('addProductBtn');

const addProductPanel =
  document.getElementById('addProductPanel');

const productForm =
  document.getElementById('productForm');

const productCategory =
  document.getElementById('productCategory');

const productMessage =
  document.getElementById('productMessage');

const saveProductBtn =
  document.getElementById('saveProductBtn');


/* =========================================================
   MANAGE PRODUCTS ELEMENTS
========================================================= */

const manageProductsBtn =
  document.getElementById('manageProductsBtn');

const manageProductsPanel =
  document.getElementById('manageProductsPanel');

const productsList =
  document.getElementById('productsList');

const manageProductsMessage =
  document.getElementById('manageProductsMessage');


/* =========================================================
   CREATE SLUG
========================================================= */

function createSlug(name) {

  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

}


/* =========================================================
   UPLOAD IMAGE TO SUPABASE STORAGE
========================================================= */

async function uploadProductImage(file, productId = 'new') {

  if (!file) {
    return null;
  }


  /* Check file type */

  if (!file.type.startsWith('image/')) {

    throw new Error(
      'Please select an image file.'
    );

  }


  /* Maximum 5 MB */

  if (file.size > 5 * 1024 * 1024) {

    throw new Error(
      'Image must be smaller than 5 MB.'
    );

  }


  /* File extension */

  const fileExtension =
    file.name
      .split('.')
      .pop()
      .toLowerCase();


  /* Unique file name */

  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}.${fileExtension}`;


  const filePath =
    `products/${productId}/${fileName}`;


  /* Upload */

  const {
    error: uploadError
  } = await supabase
    .storage
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

    throw new Error(
      `Image upload failed: ${uploadError.message}`
    );

  }


  /* Get public URL */

  const {
    data: publicUrlData
  } = supabase
    .storage
    .from('product-images')
    .getPublicUrl(filePath);


  if (!publicUrlData?.publicUrl) {

    throw new Error(
      'Unable to create image URL.'
    );

  }


  return publicUrlData.publicUrl;

}


/* =========================================================
   CREATE ADD-PRODUCT IMAGE PICKER
========================================================= */

function setupAddProductImagePicker() {

  const imageUrlInput =
    document.getElementById('productImage');

  if (!imageUrlInput) {
    return;
  }


  /* If a file input already exists, use it */

  let imageFileInput =
    document.getElementById('productImageFile');


  if (!imageFileInput) {

    imageFileInput =
      document.createElement('input');

    imageFileInput.type = 'file';
    imageFileInput.id = 'productImageFile';
    imageFileInput.accept = 'image/*';

    imageFileInput.style.display =
      'block';

    imageFileInput.style.marginTop =
      '8px';

    imageFileInput.style.width =
      '100%';

    imageUrlInput.parentNode.insertBefore(
      imageFileInput,
      imageUrlInput.nextSibling
    );

  }


  /* Change URL label/input */

  imageUrlInput.placeholder =
    'Or paste an image URL';


  /* Create preview */

  let preview =
    document.getElementById(
      'productImagePreview'
    );


  if (!preview) {

    preview =
      document.createElement('img');

    preview.id =
      'productImagePreview';

    preview.alt =
      'Product image preview';

    preview.style.display =
      'none';

    preview.style.width =
      '150px';

    preview.style.height =
      '150px';

    preview.style.objectFit =
      'cover';

    preview.style.marginTop =
      '10px';

    preview.style.borderRadius =
      '10px';

    preview.style.border =
      '1px solid #ddd';

    imageFileInput.parentNode.appendChild(
      preview
    );

  }


  /* Image selected */

  imageFileInput.addEventListener(
    'change',
    () => {

      const file =
        imageFileInput.files[0];

      if (!file) {
        return;
      }


      if (!file.type.startsWith('image/')) {

        alert(
          'Please select an image file.'
        );

        imageFileInput.value = '';

        preview.style.display =
          'none';

        return;

      }


      const previewUrl =
        URL.createObjectURL(file);

      preview.src =
        previewUrl;

      preview.style.display =
        'block';


      /* Clear URL when using Gallery */

      imageUrlInput.value = '';

    }
  );

}


/* =========================================================
   ADMIN CHECK
========================================================= */

async function checkAdmin() {

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();


  if (error || !user) {

    window.location.href =
      'index.html';

    return null;

  }


  const {
    data: profile,
    error: profileError
  } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();


  if (
    profileError ||
    !profile ||
    profile.role !== 'admin'
  ) {

    alert(
      'Access denied. Admins only.'
    );

    window.location.href =
      'index.html';

    return null;

  }


  if (adminEmail) {
    adminEmail.textContent =
      user.email;
  }


  return user;

}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

  const user =
    await checkAdmin();

  if (!user) {
    return;
  }


  const {
    count: products
  } = await supabase
    .from('products')
    .select('*', {
      count: 'exact',
      head: true
    });


  const {
    count: orders
  } = await supabase
    .from('orders')
    .select('*', {
      count: 'exact',
      head: true
    });


  const {
    count: customers
  } = await supabase
    .from('profiles')
    .select('*', {
      count: 'exact',
      head: true
    })
    .eq(
      'role',
      'customer'
    );


  const {
    count: sellers
  } = await supabase
    .from('profiles')
    .select('*', {
      count: 'exact',
      head: true
    })
    .eq(
      'role',
      'seller'
    );


  productCount.textContent =
    products ?? 0;

  orderCount.textContent =
    orders ?? 0;

  customerCount.textContent =
    customers ?? 0;

  sellerCount.textContent =
    sellers ?? 0;


  await loadCategories();

}


/* =========================================================
   LOAD CATEGORIES
========================================================= */

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
      'Category error:',
      error
    );

    productCategory.innerHTML =
      '<option value="">Unable to load categories</option>';

    return;

  }


  productCategory.innerHTML =
    '<option value="">Select category</option>';


  categories.forEach(
    category => {

      const option =
        document.createElement(
          'option'
        );

      option.value =
        category.id;

      option.textContent =
        category.name;

      productCategory.appendChild(
        option
      );

    }
  );

}


/* =========================================================
   OPEN / CLOSE ADD PRODUCT FORM
========================================================= */

addProductBtn.addEventListener(
  'click',
  () => {

    if (
      addProductPanel.style.display ===
      'none' ||
      addProductPanel.style.display === ''
    ) {

      addProductPanel.style.display =
        'block';

      addProductBtn.textContent =
        '✖ Close Product Form';

    } else {

      addProductPanel.style.display =
        'none';

      addProductBtn.textContent =
        '➕ Add Product';

    }

  }
);


/* =========================================================
   ADD PRODUCT
========================================================= */

productForm.addEventListener(
  'submit',
  async event => {

    event.preventDefault();


    productMessage.textContent =
      '';

    productMessage.className =
      '';


    saveProductBtn.disabled =
      true;

    saveProductBtn.textContent =
      'Saving Product...';


    try {

      /* Get user */

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();


      if (
        userError ||
        !user
      ) {

        throw new Error(
          'Your login session has expired. Please log in again.'
        );

      }


      /* Form values */

      const name =
        document
          .getElementById(
            'productName'
          )
          .value
          .trim();


      const categoryId =
        document
          .getElementById(
            'productCategory'
          )
          .value;


      const price =
        Number(
          document
            .getElementById(
              'productPrice'
            )
            .value
        );


      const oldPriceValue =
        document
          .getElementById(
            'productOldPrice'
          )
          .value;


      const oldPrice =
        oldPriceValue
          ? Number(oldPriceValue)
          : null;


      const stock =
        Number(
          document
            .getElementById(
              'productStock'
            )
            .value
        );


      const brand =
        document
          .getElementById(
            'productBrand'
          )
          .value
          .trim();


      const skuValue =
        document
          .getElementById(
            'productSKU'
          )
          .value
          .trim();


      const sku =
        skuValue ||
        null;


      const imageUrlInput =
        document.getElementById(
          'productImage'
        );


      const imageFileInput =
        document.getElementById(
          'productImageFile'
        );


      const imageUrl =
        imageUrlInput
          ? imageUrlInput.value.trim()
          : '';


      const imageFile =
        imageFileInput?.files?.[0] ||
        null;


      const description =
        document
          .getElementById(
            'productDescription'
          )
          .value
          .trim();


      /* Validation */

      if (!name) {

        throw new Error(
          'Please enter a product name.'
        );

      }


      if (!categoryId) {

        throw new Error(
          'Please select a category.'
        );

      }


      if (
        !Number.isFinite(price) ||
        price < 0
      ) {

        throw new Error(
          'Please enter a valid price.'
        );

      }


      if (
        !Number.isInteger(stock) ||
        stock < 0
      ) {

        throw new Error(
          'Please enter a valid stock quantity.'
        );

      }


      if (!imageFile && !imageUrl) {

        throw new Error(
          'Please choose a product image from your Gallery or enter an image URL.'
        );

      }


      /* Create slug */

      const baseSlug =
        createSlug(name);


      const slug =
        `${baseSlug}-${Date.now()}`;


      /* Insert product first */

      const {
        data: product,
        error: insertError
      } = await supabase
        .from('products')
        .insert({

          seller_id:
            user.id,

          category_id:
            Number(categoryId),

          name:
            name,

          slug:
            slug,

          description:
            description || null,

          price:
            price,

          old_price:
            oldPrice,

          stock:
            stock,

          image_url:
            imageUrl || null,

          brand:
            brand || null,

          sku:
            sku,

          is_active:
            true

        })
        .select()
        .single();


      if (insertError) {

        console.error(
          'Product insert error:',
          insertError
        );

        throw new Error(
          insertError.message
        );

      }


      /* Upload Gallery image */

      let finalImageUrl =
        imageUrl || null;


      if (imageFile) {

        saveProductBtn.textContent =
          'Uploading Image...';


        finalImageUrl =
          await uploadProductImage(
            imageFile,
            product.id
          );


        /* Save image URL */

        const {
          error: imageUpdateError
        } = await supabase
          .from('products')
          .update({
            image_url:
              finalImageUrl
          })
          .eq(
            'id',
            product.id
          );


        if (imageUpdateError) {

          console.error(
            'Image URL update error:',
            imageUpdateError
          );

          throw new Error(
            imageUpdateError.message
          );

        }

      }


      /* Success */

      productMessage.textContent =
        '✅ Product added successfully!';

      productMessage.className =
        'success-message';


      productForm.reset();


      const preview =
        document.getElementById(
          'productImagePreview'
        );


      if (preview) {

        preview.src =
          '';

        preview.style.display =
          'none';

      }


      await loadProducts();

      await loadDashboard();


    } catch (error) {

      console.error(error);


      productMessage.textContent =
        `❌ ${error.message}`;


      productMessage.className =
        'error-message';

    }


    saveProductBtn.disabled =
      false;

    saveProductBtn.textContent =
      '➕ Save Product';

  }
);


/* =========================================================
   MANAGE PRODUCTS BUTTON
========================================================= */

manageProductsBtn.addEventListener(
  'click',
  async () => {

    if (
      manageProductsPanel.style.display ===
      'none' ||
      manageProductsPanel.style.display === ''
    ) {

      manageProductsPanel.style.display =
        'block';

      manageProductsBtn.textContent =
        '✖ Close Products';


      await loadProducts();

    } else {

      manageProductsPanel.style.display =
        'none';

      manageProductsBtn.textContent =
        '📦 Manage Products';

    }

  }
);


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

  productsList.innerHTML =
    '<p>Loading products...</p>';

  manageProductsMessage.textContent =
    '';


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
    .order(
      'created_at',
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      'Products error:',
      error
    );

    productsList.innerHTML =
      '<p>Unable to load products.</p>';

    return;

  }


  if (
    !products ||
    products.length === 0
  ) {

    productsList.innerHTML =
      '<p>No products found.</p>';

    return;

  }


  productsList.innerHTML =
    '';


  products.forEach(
    product => {

      const card =
        document.createElement(
          'div'
        );


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

        <div style="
          flex:1;
          min-width:220px;
        ">

          <h4 style="
            margin-bottom:6px;
          ">
            ${product.name}
          </h4>

          <p style="
            margin:4px 0;
          ">
            Category:
            ${product.categories?.name || 'Uncategorized'}
          </p>

          <p style="
            margin:4px 0;
          ">
            Price:
            <strong>
              GH₵ ${Number(product.price).toFixed(2)}
            </strong>
          </p>

          <p style="
            margin:4px 0;
          ">
            Stock:
            ${product.stock}
          </p>

          <p style="
            margin:4px 0;
          ">
            Status:
            ${
              product.is_active
                ? '🟢 Active'
                : '🔴 Inactive'
            }
          </p>

        </div>

        <div style="
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        ">

          <button
            class="admin-btn edit-product-btn"
            data-id="${product.id}"
          >
            ✏️ Edit
          </button>

          <button
            class="admin-btn toggle-product-btn"
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
            class="admin-btn delete-product-btn"
            data-id="${product.id}"
            style="
              background:#c62828;
            "
          >
            🗑️ Delete
          </button>

        </div>

      `;


      productsList.appendChild(
        card
      );

    }
  );


  /* =========================================================
     DELETE
  ========================================================= */

  document
    .querySelectorAll(
      '.delete-product-btn'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const productId =
              button.dataset.id;


            const confirmed =
              confirm(
                'Are you sure you want to delete this product?'
              );


            if (!confirmed) {
              return;
            }


            const {
              error
            } = await supabase
              .from('products')
              .delete()
              .eq(
                'id',
                productId
              );


            if (error) {

              alert(
                `Unable to delete product: ${error.message}`
              );

              return;

            }


            alert(
              'Product deleted successfully.'
            );


            await loadProducts();

            await loadDashboard();

          }
        );

      }
    );


  /* =========================================================
     ACTIVATE / DEACTIVATE
  ========================================================= */

  document
    .querySelectorAll(
      '.toggle-product-btn'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const productId =
              button.dataset.id;


            const currentlyActive =
              button.dataset.active ===
              'true';


            const {
              error
            } = await supabase
              .from('products')
              .update({

                is_active:
                  !currentlyActive

              })
              .eq(
                'id',
                productId
              );


            if (error) {

              alert(
                `Unable to update product: ${error.message}`
              );

              return;

            }


            await loadProducts();

          }
        );

      }
    );


  /* =========================================================
     EDIT
  ========================================================= */

  document
    .querySelectorAll(
      '.edit-product-btn'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const productId =
              button.dataset.id;


            const product =
              products.find(
                item =>
                  String(item.id) ===
                  String(productId)
              );


            if (!product) {
              return;
            }


            openEditProduct(
              product
            );

          }
        );

      }
    );

}


/* =========================================================
   OPEN EDIT PRODUCT
========================================================= */

async function openEditProduct(product) {

  const editPanel =
    document.getElementById(
      'editProductPanel'
    );

  const editMessage =
    document.getElementById(
      'editProductMessage'
    );


  document
    .getElementById(
      'editProductId'
    )
    .value =
      product.id;


  document
    .getElementById(
      'editProductName'
    )
    .value =
      product.name || '';


  document
    .getElementById(
      'editProductPrice'
    )
    .value =
      product.price ?? '';


  document
    .getElementById(
      'editProductOldPrice'
    )
    .value =
      product.old_price ?? '';


  document
    .getElementById(
      'editProductStock'
    )
    .value =
      product.stock ?? '';


  document
    .getElementById(
      'editProductBrand'
    )
    .value =
      product.brand || '';


  document
    .getElementById(
      'editProductSKU'
    )
    .value =
      product.sku || '';


  document
    .getElementById(
      'editProductDescription'
    )
    .value =
      product.description || '';


  document
    .getElementById(
      'editProductActive'
    )
    .value =
      product.is_active
        ? 'true'
        : 'false';


  /* Store current image */

  const imageFileInput =
    document.getElementById(
      'editProductImageFile'
    );


  if (imageFileInput) {

    imageFileInput.dataset.currentImage =
      product.image_url || '';

    imageFileInput.value =
      '';

  }


  /* Show current image */

  const preview =
    document.getElementById(
      'editProductImagePreview'
    );


  if (
    preview &&
    product.image_url
  ) {

    preview.src =
      product.image_url;

    preview.style.display =
      'block';

  } else if (preview) {

    preview.src =
      '';

    preview.style.display =
      'none';

  }


  editMessage.textContent =
    '';


  /* Load categories */

  const categorySelect =
    document.getElementById(
      'editProductCategory'
    );


  categorySelect.innerHTML =
    '<option value="">Loading categories...</option>';


  const {
    data: categories,
    error: categoryError
  } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');


  if (categoryError) {

    console.error(
      'Category loading error:',
      categoryError
    );


    categorySelect.innerHTML =
      '<option value="">Unable to load categories</option>';

  } else {

    categorySelect.innerHTML =
      '<option value="">Select category</option>';


    categories.forEach(
      category => {

        const option =
          document.createElement(
            'option'
          );


        option.value =
          category.id;


        option.textContent =
          category.name;


        if (
          String(category.id) ===
          String(product.category_id)
        ) {

          option.selected =
            true;

        }


        categorySelect.appendChild(
          option
        );

      }
    );

  }


  editPanel.style.display =
    'block';


  editPanel.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

}


/* =========================================================
   EDIT IMAGE PREVIEW
========================================================= */

const editImageFile =
  document.getElementById(
    'editProductImageFile'
  );

const editImagePreview =
  document.getElementById(
    'editProductImagePreview'
  );


if (
  editImageFile &&
  editImagePreview
) {

  editImageFile.addEventListener(
    'change',
    () => {

      const file =
        editImageFile.files[0];


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          'image/'
        )
      ) {

        alert(
          'Please select an image file.'
        );

        editImageFile.value =
          '';

        return;

      }


      const imageUrl =
        URL.createObjectURL(
          file
        );


      editImagePreview.src =
        imageUrl;


      editImagePreview.style.display =
        'block';

    }
  );

}


/* =========================================================
   UPDATE PRODUCT
========================================================= */

async function updateProduct(productId) {

  const name =
    document
      .getElementById(
        'editProductName'
      )
      .value
      .trim();


  const categoryId =
    document
      .getElementById(
        'editProductCategory'
      )
      .value;


  const price =
    Number(
      document
        .getElementById(
          'editProductPrice'
        )
        .value
    );


  const oldPriceValue =
    document
      .getElementById(
        'editProductOldPrice'
      )
      .value;


  const oldPrice =
    oldPriceValue === ''
      ? null
      : Number(oldPriceValue);


  const stock =
    Number(
      document
        .getElementById(
          'editProductStock'
        )
        .value
    );


  const brand =
    document
      .getElementById(
        'editProductBrand'
      )
      .value
      .trim();


  const sku =
    document
      .getElementById(
        'editProductSKU'
      )
      .value
      .trim();


  const description =
    document
      .getElementById(
        'editProductDescription'
      )
      .value
      .trim();


  const isActive =
    document
      .getElementById(
        'editProductActive'
      )
      .value ===
      'true';


  const imageFileInput =
    document.getElementById(
      'editProductImageFile'
    );


  const editMessage =
    document.getElementById(
      'editProductMessage'
    );


  const updateButton =
    document.getElementById(
      'updateProductBtn'
    );


  /* Validation */

  if (!name) {

    editMessage.textContent =
      '❌ Product name is required.';

    return;

  }


  if (!categoryId) {

    editMessage.textContent =
      '❌ Please select a category.';

    return;

  }


  if (
    !Number.isFinite(price) ||
    price < 0
  ) {

    editMessage.textContent =
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

    editMessage.textContent =
      '❌ Please enter a valid old price.';

    return;

  }


  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {

    editMessage.textContent =
      '❌ Please enter a valid stock quantity.';

    return;

  }


  updateButton.disabled =
    true;

  updateButton.textContent =
    'Saving...';

  editMessage.textContent =
    '';


  try {

    /* Current image */

    let imageUrl =
      imageFileInput?.dataset.currentImage ||
      '';


    /* New image */

    const selectedFile =
      imageFileInput?.files?.[0] ||
      null;


    if (selectedFile) {

      updateButton.textContent =
        'Uploading image...';


      imageUrl =
        await uploadProductImage(
          selectedFile,
          productId
        );

    }


    /* Update product */

    updateButton.textContent =
      'Saving product...';


    const {
      error
    } = await supabase
      .from('products')
      .update({

        name:
          name,

        category_id:
          Number(categoryId),

        price:
          price,

        old_price:
          oldPrice,

        stock:
          stock,

        brand:
          brand || null,

        sku:
          sku || null,

        image_url:
          imageUrl || null,

        description:
          description || null,

        is_active:
          isActive,

        updated_at:
          new Date().toISOString()

      })
      .eq(
        'id',
        productId
      );


    if (error) {

      console.error(
        'Update product error:',
        error
      );

      throw new Error(
        error.message
      );

    }


    /* Success */

    editMessage.textContent =
      '✅ Product updated successfully!';

    editMessage.className =
      'success-message';


    if (imageFileInput) {

      imageFileInput.value =
        '';

      imageFileInput.dataset.currentImage =
        imageUrl;

    }


    await loadProducts();

    await loadDashboard();


    setTimeout(
      () => {

        document
          .getElementById(
            'editProductPanel'
          )
          .style.display =
          'none';

      },
      1000
    );


  } catch (error) {

    console.error(
      error
    );


    editMessage.textContent =
      `❌ ${error.message}`;


    editMessage.className =
      'error-message';

  }


  updateButton.disabled =
    false;

  updateButton.textContent =
    '💾 Save Changes';

}


/* =========================================================
   EDIT FORM SUBMIT
========================================================= */

const editProductForm =
  document.getElementById(
    'editProductForm'
  );


if (editProductForm) {

  editProductForm.addEventListener(
    'submit',
    async event => {

      event.preventDefault();


      const productId =
        document
          .getElementById(
            'editProductId'
          )
          .value;


      await updateProduct(
        productId
      );

    }
  );

}


/* =========================================================
   CANCEL EDIT
========================================================= */

const cancelEditBtn =
  document.getElementById(
    'cancelEditBtn'
  );


if (cancelEditBtn) {

  cancelEditBtn.addEventListener(
    'click',
    () => {

      document
        .getElementById(
          'editProductPanel'
        )
        .style.display =
        'none';

    }
  );

}


/* =========================================================
   OTHER BUTTONS
========================================================= */

const messagesBtn =
  document.getElementById(
    'messagesBtn'
  );


if (messagesBtn) {

  messagesBtn.addEventListener(
    'click',
    () => {

      alert(
        'Messages panel coming next.'
      );

    }
  );

}


const ordersBtn =
  document.getElementById(
    'ordersBtn'
  );


if (ordersBtn) {

  ordersBtn.addEventListener(
    'click',
    () => {

      alert(
        'Order management coming next.'
      );

    }
  );

}


const customersBtn =
  document.getElementById(
    'customersBtn'
  );


if (customersBtn) {

  customersBtn.addEventListener(
    'click',
    () => {

      alert(
        'Customer management coming next.'
      );

    }
  );

}


const sellersBtn =
  document.getElementById(
    'sellersBtn'
  );


if (sellersBtn) {

  sellersBtn.addEventListener(
    'click',
    () => {

      alert(
        'Seller management coming next.'
      );

    }
  );

}


/* =========================================================
   LOGOUT
========================================================= */

const logoutBtn =
  document.getElementById(
    'logoutBtn'
  );


if (logoutBtn) {

  logoutBtn.addEventListener(
    'click',
    async () => {

      await supabase.auth.signOut();

      window.location.href =
        'index.html';

    }
  );

}


/* =========================================================
   START
========================================================= */

setupAddProductImagePicker();

loadDashboard();
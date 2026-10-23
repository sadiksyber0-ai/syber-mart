
import { supabase } from './supabase.js';

const statusEl = document.getElementById('messageStatus');
const productIdEl = document.getElementById('productId');
const sellerIdEl = document.getElementById('sellerId');
const startBtn = document.getElementById('startConversationBtn');
const listEl = document.getElementById('conversationMessages');
const inputEl = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendMessageBtn');
const refreshBtn = document.getElementById('refreshMessagesBtn');

let currentUser = null;
let currentOtherUserId = null;
let currentProductId = null;
let refreshTimer = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

async function initialize() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    setStatus('Please sign in to use messages.');
    return;
  }

  currentUser = data.user;
  setStatus('Signed in. Enter a product ID and seller account ID to start.');

  startBtn.disabled = false;
  sendBtn.disabled = true;

  await loadConversationList();
}

async function loadConversationList() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, recipient_id, product_id, message, created_at')
    .or(
      `sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    setStatus('Could not load conversations: ' + error.message);
    return;
  }

  const conversations = new Map();

  for (const message of data || []) {
    const otherId = message.sender_id === currentUser.id
      ? message.recipient_id
      : message.sender_id;

    const key = `${otherId}:${message.product_id}`;

    if (!conversations.has(key)) {
      conversations.set(key, {
        otherId,
        productId: message.product_id,
        message: message.message,
        createdAt: message.created_at
      });
    }
  }

  let section = document.getElementById('conversationList');

  if (!section) {
    section = document.createElement('section');
    section.className = 'message-box';
    section.innerHTML = '<h2>Your conversations</h2><div id="conversationListItems"></div>';
    document.querySelector('.messaging-page').prepend(section);
  }

  const items = section.querySelector('#conversationListItems');
  items.replaceChildren();

  if (!conversations.size) {
    items.textContent = 'No conversations yet.';
    return;
  }

  for (const conversation of conversations.values()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.style.cssText = 'display:block;width:100%;margin:8px 0;padding:12px;text-align:left;';
    button.textContent =
      `Product #${conversation.productId} · ${conversation.message.slice(0, 70)}`;

    button.addEventListener('click', () => {
      currentOtherUserId = conversation.otherId;
      currentProductId = conversation.productId;
      productIdEl.value = conversation.productId;
      sellerIdEl.value = conversation.otherId;
      sendBtn.disabled = false;
      renderMessages();
    });

    items.appendChild(button);
  }
}

async function renderMessages() {
  if (!currentUser || !currentOtherUserId || !currentProductId) return;

  const { data, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, recipient_id, product_id, message, created_at')
    .eq('product_id', currentProductId)
    .or(
      `and(sender_id.eq.${currentUser.id},recipient_id.eq.${currentOtherUserId}),and(sender_id.eq.${currentOtherUserId},recipient_id.eq.${currentUser.id})`
    )
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    setStatus('Could not load messages: ' + error.message);
    return;
  }

  listEl.replaceChildren();

  for (const message of data || []) {
    const card = document.createElement('article');
    card.className = 'message-box';

    const sender = message.sender_id === currentUser.id
      ? 'You'
      : 'Other participant';

    card.innerHTML = `
      <strong>${escapeHTML(sender)}</strong>
      <p>${escapeHTML(message.message)}</p>
      <small>${escapeHTML(new Date(message.created_at).toLocaleString())}</small>
    `;

    listEl.appendChild(card);
  }

  listEl.scrollTop = listEl.scrollHeight;
}

startBtn.addEventListener('click', async () => {
  if (!currentUser) {
    setStatus('Please sign in first.');
    return;
  }

  const productId = Number(productIdEl.value);
  const recipientId = sellerIdEl.value.trim();

  if (!Number.isSafeInteger(productId) || productId < 1 || !recipientId) {
    setStatus('Enter a valid product ID and seller account UUID.');
    return;
  }

  const { data: product, error } = await supabase
    .from('products')
    .select('id, seller_id, is_active')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !product) {
    setStatus('Could not find that active product.');
    return;
  }

  if (product.seller_id !== recipientId) {
    setStatus('The seller ID does not match this product.');
    return;
  }

  if (recipientId === currentUser.id) {
    setStatus('You cannot message yourself.');
    return;
  }

  currentProductId = productId;
  currentOtherUserId = recipientId;
  sendBtn.disabled = false;

  setStatus('Conversation opened.');
  await renderMessages();
  await loadConversationList();
});

sendBtn.addEventListener('click', async () => {
  const message = inputEl.value.trim();

  if (!currentUser || !currentOtherUserId || !currentProductId) {
    setStatus('Open a conversation first.');
    return;
  }

  if (!message) {
    setStatus('Type a message first.');
    return;
  }

  sendBtn.disabled = true;

  const { error } = await supabase
    .from('direct_messages')
    .insert({
      sender_id: currentUser.id,
      recipient_id: currentOtherUserId,
      product_id: currentProductId,
      message
    });

  sendBtn.disabled = false;

  if (error) {
    console.error(error);
    setStatus('Message could not be sent: ' + error.message);
    return;
  }

  inputEl.value = '';
  setStatus('Message sent.');
  await renderMessages();
  await loadConversationList();
});

refreshBtn.addEventListener('click', async () => {
  await renderMessages();
  await loadConversationList();
});

initialize();

window.addEventListener('beforeunload', () => {
  if (refreshTimer) clearInterval(refreshTimer);
});

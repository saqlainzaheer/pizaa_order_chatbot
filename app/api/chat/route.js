import OpenAI from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let conversationHistory = [];
let menuData = [];

// Function to fetch menu data
async function fetchMenuData() {
  const response = await fetch('https://react-fast-pizza-api.onrender.com/api/menu');
  const data = await response.json();
  menuData = data.data;
}

// Initialize menu data
fetchMenuData();

// Function to find pizza ID by name
function getPizzaIdByName(pizzaName) {
  const pizza = menuData.find(p => p.name.toLowerCase() === pizzaName.toLowerCase());
  return pizza ? pizza.id : null;
}

// Function to handle order placement
async function handleOrderPlacement(orderDetails) {
  const response = await fetch('https://react-fast-pizza-api.onrender.com/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderDetails),
  });

  const result = await response.json();
  return result;
}

// Function to gather information from the user
async function gatherOrderDetails() {
  const orderDetails = {
    customer: '',
    phone: '',
    address: '',
    cart: [],
    priority: false,
    paymentMethod: 'Cash on Delivery',
  };

  // Ask for customer name
  conversationHistory.push({ role: 'assistant', content: 'Let’s start with your name. What’s your name?' });
  let completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: conversationHistory,
  });
  orderDetails.customer = completion.choices[0].message.content.trim();
  conversationHistory.push({ role: 'user', content: orderDetails.customer });

  // Ask for phone number
  conversationHistory.push({ role: 'assistant', content: 'Got it! What’s your phone number?' });
  completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: conversationHistory,
  });
  orderDetails.phone = completion.choices[0].message.content.trim();
  conversationHistory.push({ role: 'user', content: orderDetails.phone });

  // Ask for address
  conversationHistory.push({ role: 'assistant', content: 'Thanks! Now, what’s your address?' });
  completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: conversationHistory,
  });
  orderDetails.address = completion.choices[0].message.content.trim();
  conversationHistory.push({ role: 'user', content: orderDetails.address });

  // Ask for pizza details
  let addMorePizzas = true;
  while (addMorePizzas) {
    // Ask for pizza name
    conversationHistory.push({ role: 'assistant', content: 'Which pizza would you like to order?' });
    completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversationHistory,
    });
    const pizzaName = completion.choices[0].message.content.trim();
    conversationHistory.push({ role: 'user', content: pizzaName });

    // Get pizza ID from name
    const pizzaId = getPizzaIdByName(pizzaName);
    if (!pizzaId) {
      conversationHistory.push({ role: 'assistant', content: 'Sorry, we do not have that pizza. Please choose another one.' });
      continue;
    }

    // Ask for quantity
    conversationHistory.push({ role: 'assistant', content: 'How many would you like to order?' });
    completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversationHistory,
    });
    const quantity = parseInt(completion.choices[0].message.content.trim());
    conversationHistory.push({ role: 'user', content: quantity.toString() });

    // Find unit price from menu
    const pizza = menuData.find(p => p.id === pizzaId);
    const unitPrice = pizza.unitPrice;

    // Add to cart
    orderDetails.cart.push({
      pizzaId,
      name: pizzaName,
      quantity,
      unitPrice,
      totalprice: unitPrice * quantity,
    });

    // Ask if they want to add more pizzas
    conversationHistory.push({ role: 'assistant', content: 'Would you like to add another pizza to your order? (yes/no)' });
    completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversationHistory,
    });
    const addMoreResponse = completion.choices[0].message.content.trim().toLowerCase();
    conversationHistory.push({ role: 'user', content: addMoreResponse });
    addMorePizzas = addMoreResponse === 'yes';
  }

  // Ask for priority order
  conversationHistory.push({ role: 'assistant', content: 'Would you like to prioritize your order? (yes/no)' });
  completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: conversationHistory,
  });
  const priorityResponse = completion.choices[0].message.content.trim().toLowerCase();
  conversationHistory.push({ role: 'user', content: priorityResponse });
  orderDetails.priority = priorityResponse === 'yes';

  return orderDetails;
}

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    conversationHistory.push({ role: 'user', content: message });

    const systemPrompt = {
      role: 'system',
      content: 'You are a helpful assistant for ordering pizzas. You only help with pizza-related questions and ordering. The payment method is cash on delivery.',
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemPrompt, ...conversationHistory, { role: 'system', content: `Menu data: ${JSON.stringify(menuData)}` }],
    });

    const reply = completion.choices[0].message.content;

    if (reply.toLowerCase().includes('how can you help me in placing order')) {
      conversationHistory.push({
        role: 'assistant',
        content: 'I can help you place an order by asking for your details and your pizza preferences. Let\'s start with your name. What is your name?',
      });
      return new Response(
        JSON.stringify({
          reply: 'I can help you place an order by asking for your details and your pizza preferences. Let\'s start with your name. What is your name?',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (reply.toLowerCase().includes('place an order')) {
      const orderDetails = await gatherOrderDetails();
      const orderResult = await handleOrderPlacement(orderDetails);
      conversationHistory.push({
        role: 'assistant',
        content: `Order placed successfully. Your order ID is ${orderResult.data.id}. Here are the details: ${JSON.stringify(orderResult.data)}`,
      });
      return new Response(JSON.stringify(orderResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      conversationHistory.push({ role: 'assistant', content: reply });
      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Error processing request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

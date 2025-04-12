import fetch from 'node-fetch';

const SMSQUICKER_API_URL = 'https://www.smsquicker.com/api/v1/send';
const SMSQUICKER_SENDER_ID = '174417319042fe880812925e520249e808937738d267f5f88667437';
const SMSQUICKER_API_KEY = '84b9c3a61247953785d4ca34326eedc475177e64';

export async function sendWhatsAppNotification(phoneNumber, type, data) {
  try {
    console.log('Sending WhatsApp notification:', {
      phoneNumber,
      type,
      data
    });

    // Format phone number to remove any spaces and ensure it starts with country code
    // Remove '+' as SMS Quicker doesn't expect it
    const formattedPhone = phoneNumber.replace(/\s+/g, '').replace(/^\+/, '');

    // Format items array into a readable string
    const formattedItems = Array.isArray(data.items) 
      ? data.items.join('\n• ') 
      : data.items;

    // Create message based on type
    let message = '';
    if (type === 'dispatch') {
      message = `🚚 New Dispatch Alert!\n\n`
        + `Dispatch ID: ${data.dispatch_id}\n`
        + `From: ${data.from_location}\n`
        + `To: ${data.to_location}\n`
        + `Date: ${data.date}\n`
        + `Vehicle: ${data.vehicle}\n\n`
        + `Items:\n• ${formattedItems}\n\n`
        + `Please acknowledge receipt when items arrive.`;
    } else if (type === 'received') {
      message = `✅ Dispatch Received Confirmation\n\n`
        + `Dispatch ID: ${data.dispatch_id}\n`
        + `Received by: ${data.received_by}\n`
        + `Date: ${data.received_date}\n\n`
        + `Items received:\n• ${formattedItems}`;
    }

    const payload = {
      apikey: SMSQUICKER_API_KEY,
      mobile: formattedPhone,
      msg: message,
      senderid: SMSQUICKER_SENDER_ID,
      route: "whatsapp"
    };

    console.log('Request payload:', payload);

    const response = await fetch(SMSQUICKER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // First check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Try to parse response as JSON
    let responseData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      // If not JSON, get text content
      const text = await response.text();
      console.log('Non-JSON response:', text);
      responseData = { success: response.ok, message: text };
    }
    
    console.log('WhatsApp API response:', responseData);

    return {
      success: response.ok,
      data: responseData
    };
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export function formatDispatchItems(items) {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => {
    const name = item.name || item.inventory?.product?.name || item.inventory?.name || 'Unknown Item';
    const quantity = item.quantity || 0;
    return `${name}: ${quantity} pcs`;
  });
}
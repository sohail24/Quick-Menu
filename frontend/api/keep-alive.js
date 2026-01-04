export default async function handler(request, response) {
  const BACKEND_URL = process.env.VITE_API_BASE_URL || 'https://quick-menu-dq9o.onrender.com';
  
  // Add random delay between 1 and 59 seconds
  const randomDelay = Math.floor(Math.random() * 59000) + 1000;
  await new Promise(resolve => setTimeout(resolve, randomDelay));
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    const status = res.status;
    response.status(200).json({ 
      success: true, 
      backendStatus: status,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    response.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

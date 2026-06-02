const axios = require('axios');

async function test() {
    try {
        const res = await axios.put('http://localhost:3000/api/saas/users/1', {
            name: 'Test',
            email: 'test@test.com',
            password: 'newpassword123',
            role: 'ADMIN'
        });
        console.log("Success:", res.data);
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
}
test();

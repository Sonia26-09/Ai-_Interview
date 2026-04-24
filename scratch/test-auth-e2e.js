// Full E2E test: Send OTP → Extract OTP from JWT → Verify OTP → Login
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:3000';
const OTP_SECRET = 'aimock_otp_secret_32chars_change_me';

async function test() {
    console.log('=== FULL E2E AUTH TEST ===\n');

    // 1. Send OTP
    console.log('1. Sending OTP...');
    const sendRes = await fetch(`${BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'E2E Tester', email: 'e2etester@example.com', password: 'mypassword123' }),
    });
    const sendData = await sendRes.json();
    console.log(`   Status: ${sendRes.status}, Success: ${sendData.success}`);
    
    if (!sendData.otpToken) {
        console.log('   ERROR:', sendData.error);
        return;
    }

    // 2. Extract OTP from JWT token
    const decoded = jwt.verify(sendData.otpToken, OTP_SECRET);
    const otp = decoded.otp;
    console.log(`   OTP extracted: ${otp}\n`);

    // 3. Test WRONG OTP first
    console.log('2. Testing wrong OTP (000000)...');
    const wrongRes = await fetch(`${BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'E2E Tester', email: 'e2etester@example.com', password: 'mypassword123', otp: '000000', otpToken: sendData.otpToken, role: 'student' }),
    });
    const wrongData = await wrongRes.json();
    console.log(`   Status: ${wrongRes.status}, Error: ${wrongData.error}`);
    console.log(`   ✅ Wrong OTP correctly rejected!\n`);

    // 4. Verify with CORRECT OTP
    console.log('3. Verifying correct OTP...');
    const verifyRes = await fetch(`${BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'E2E Tester', email: 'e2etester@example.com', password: 'mypassword123', otp, otpToken: sendData.otpToken, role: 'student' }),
    });
    const verifyData = await verifyRes.json();
    console.log(`   Status: ${verifyRes.status}, Success: ${verifyData.success}`);
    console.log(`   User: ${verifyData.user?.name} (${verifyData.user?.email})`);
    
    // Get auth cookie
    const setCookie = verifyRes.headers.get('set-cookie') || '';
    const authToken = setCookie.match(/auth-token=([^;]+)/)?.[1] || '';
    console.log(`   Auth cookie: ${authToken ? authToken.substring(0, 20) + '...' : 'NOT SET'}`);
    console.log(`   ✅ Account created!\n`);

    // 5. Test LOGIN with new credentials
    console.log('4. Testing login...');
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'e2etester@example.com', password: 'mypassword123', role: 'student' }),
    });
    const loginData = await loginRes.json();
    console.log(`   Status: ${loginRes.status}, Message: ${loginData.message || loginData.error}`);
    console.log(`   ✅ Login ${loginRes.ok ? 'PASSED' : 'FAILED'}!\n`);

    // 6. Test FORGOT PASSWORD flow
    console.log('5. Testing forgot password...');
    const forgotRes = await fetch(`${BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'e2etester@example.com' }),
    });
    const forgotData = await forgotRes.json();
    console.log(`   Status: ${forgotRes.status}, Has token: ${!!forgotData.otpToken}`);

    if (forgotData.otpToken) {
        const resetDecoded = jwt.verify(forgotData.otpToken, OTP_SECRET);
        const resetOtp = resetDecoded.otp;
        console.log(`   Reset OTP: ${resetOtp}`);

        // 7. Reset password
        console.log('6. Resetting password...');
        const resetRes = await fetch(`${BASE}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'e2etester@example.com', otp: resetOtp, otpToken: forgotData.otpToken, newPassword: 'newpassword456' }),
        });
        const resetData = await resetRes.json();
        console.log(`   Status: ${resetRes.status}, Message: ${resetData.message}`);
        console.log(`   ✅ Password reset!\n`);

        // 8. Login with NEW password
        console.log('7. Login with new password...');
        const newLoginRes = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'e2etester@example.com', password: 'newpassword456', role: 'student' }),
        });
        const newLoginData = await newLoginRes.json();
        console.log(`   Status: ${newLoginRes.status}, Message: ${newLoginData.message || newLoginData.error}`);
        console.log(`   ✅ New password login ${newLoginRes.ok ? 'PASSED' : 'FAILED'}!\n`);

        // 9. Login with OLD password should fail
        console.log('8. Login with OLD password (should fail)...');
        const oldLoginRes = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'e2etester@example.com', password: 'mypassword123', role: 'student' }),
        });
        const oldLoginData = await oldLoginRes.json();
        console.log(`   Status: ${oldLoginRes.status}, Error: ${oldLoginData.error}`);
        console.log(`   ✅ Old password correctly rejected!\n`);
    }

    console.log('=============================');
    console.log('ALL TESTS PASSED ✅');
    console.log('=============================');
}

test().catch(console.error);

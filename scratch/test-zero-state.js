// Test auth + verify new user has zero stats
const jwt = require('jsonwebtoken');
const BASE = 'http://localhost:3000';
const OTP_SECRET = 'aimock_otp_secret_32chars_change_me';

async function test() {
    const ts = Date.now();
    const email = `test${ts}@example.com`;
    
    console.log('=== AUTH + ZERO-STATE TEST ===\n');

    // 1. Signup with OTP
    console.log('1. Send OTP...');
    const sendRes = await fetch(`${BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New User', email, password: 'testpass123' }),
    });
    const sendData = await sendRes.json();
    console.log(`   Status: ${sendRes.status}`);
    if (!sendData.otpToken) { console.log('   Error:', sendData.error); return; }
    
    const decoded = jwt.verify(sendData.otpToken, OTP_SECRET);
    
    // 2. Verify OTP
    console.log('2. Verify OTP...');
    const verifyRes = await fetch(`${BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New User', email, password: 'testpass123', otp: decoded.otp, otpToken: sendData.otpToken, role: 'student' }),
    });
    const verifyData = await verifyRes.json();
    console.log(`   Status: ${verifyRes.status}, User: ${verifyData.user?.name}`);
    const authCookie = verifyRes.headers.get('set-cookie')?.match(/auth-token=([^;]+)/)?.[1];
    console.log(`   ✅ Account created\n`);

    // 3. Fetch /api/auth/me — verify zero stats
    console.log('3. Checking user stats (should be zero)...');
    const meRes = await fetch(`${BASE}/api/auth/me`, {
        headers: { 'Cookie': `auth-token=${authCookie}` },
    });
    const meData = await meRes.json();
    const u = meData.user;
    
    console.log(`   Name: ${u.name}`);
    console.log(`   XP: ${u.xp} (expected: 0)`);
    console.log(`   Level: ${u.level} (expected: 1)`);
    console.log(`   Streak: ${u.streak} (expected: 0)`);
    console.log(`   Total Attempts: ${u.totalAttempts} (expected: 0)`);
    console.log(`   Average Score: ${u.averageScore} (expected: 0)`);
    console.log(`   Badges: ${u.badges?.length} (expected: 0)`);
    console.log(`   Total Interviews: ${u.totalInterviews} (expected: 0)`);
    console.log(`   Active Roles: ${u.activeRoles} (expected: 0)`);
    
    const allZero = u.xp === 0 && u.level === 1 && u.streak === 0 && 
                    u.totalAttempts === 0 && u.averageScore === 0 && 
                    u.badges?.length === 0;
    
    console.log(`\n   ${allZero ? '✅ ALL STATS ARE ZERO — NEW USER HAS CLEAN STATE!' : '❌ SOME STATS ARE NOT ZERO — BUG!'}`);
    
    // 4. Login test
    console.log('\n4. Testing login...');
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'testpass123', role: 'student' }),
    });
    const loginData = await loginRes.json();
    console.log(`   Status: ${loginRes.status}, Message: ${loginData.message}`);
    console.log(`   ✅ Login ${loginRes.ok ? 'PASSED' : 'FAILED'}`);

    console.log('\n=============================');
    console.log(allZero && loginRes.ok ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌');
    console.log('=============================');
}

test().catch(console.error);

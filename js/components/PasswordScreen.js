// Miami Beach Resort - Password Screen Component
// v27.0-dynamic-rooms

function PasswordScreen({onSuccess}) {
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    const [shake, setShake] = React.useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === PASSWORD) {
            createSession();
            onSuccess();
        } else {
            setError("Incorrect password");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setPassword("");
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(135deg, #1E293B 0%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '40px',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                animation: shake ? 'shake 0.5s' : 'none'
            }}>
                <div style={{fontSize: '60px', marginBottom: '20px'}}>🔐</div>
                <h1 style={{fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#fff'}}>Miami Beach Resort</h1>
                <p style={{color: 'rgba(255,255,255,0.5)', marginBottom: '30px', fontSize: '14px'}}>Enter password to access dashboard</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {setPassword(e.target.value); setError("");}}
                        placeholder="Enter password"
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '16px 20px',
                            fontSize: '18px',
                            background: 'rgba(255,255,255,0.08)',
                            border: error ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            textAlign: 'center',
                            letterSpacing: '8px',
                            marginBottom: '16px',
                            outline: 'none'
                        }}
                    />
                    {error && <p style={{color: '#ef4444', fontSize: '14px', marginBottom: '16px'}}>{error}</p>}
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '16px',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #2D6A6A, #245858)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        Unlock Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}

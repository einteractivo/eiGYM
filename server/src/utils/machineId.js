const { execSync } = require('child_process');
const os = require('os');

/**
 * Gets a unique machine identifier.
 * Works on both Linux (cPanel) and Windows.
 */
const getMachineId = () => {
    const platform = process.platform;

    try {
        if (platform === 'linux') {
            // Linux/cPanel: use /etc/machine-id or /var/lib/dbus/machine-id
            try {
                const id = require('fs').readFileSync('/etc/machine-id', 'utf8').trim();
                if (id) return id;
            } catch (e) { }

            try {
                const id = require('fs').readFileSync('/var/lib/dbus/machine-id', 'utf8').trim();
                if (id) return id;
            } catch (e) { }

            // Fallback: use hostname
            return `LINUX-${os.hostname()}`;
        }

        if (platform === 'win32') {
            // Windows: WMIC
            try {
                const output = execSync('wmic csproduct get uuid', { stdio: ['pipe', 'pipe', 'ignore'], timeout: 3000 }).toString();
                const uuid = output.split('\n')[1]?.trim();
                if (uuid && uuid !== 'UUID' && uuid !== 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF') {
                    return uuid;
                }
            } catch (e) { }

            // Windows: PowerShell fallback
            try {
                const psOutput = execSync('powershell -command "(Get-WmiObject Win32_ComputerSystemProduct).UUID"', {
                    stdio: ['pipe', 'pipe', 'ignore'],
                    timeout: 3000
                }).toString().trim();
                if (psOutput && psOutput !== 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF') {
                    return psOutput;
                }
            } catch (e) { }
        }
    } catch (error) {
        // Silent fail
    }

    // Universal fallback
    return `${platform.toUpperCase()}-${os.hostname()}-GENERIC`;
};

module.exports = { getMachineId };

const db = require("../database/db");

const logActivity = ({
    user_id,
    action,
    module,
    status,
    message,
    ip_address
}) => {

    const query = `
        INSERT INTO activity_logs (
            user_id,
            action,
            module,
            status,
            message,
            ip_address
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(query);

    stmt.run(
        user_id,
        action,
        module,
        status,
        message,
        ip_address
    );
};

module.exports = logActivity;
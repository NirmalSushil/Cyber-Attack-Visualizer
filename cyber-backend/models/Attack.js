const pool = require('../config/db');

class Attack {

    static async create(data) {

        const {
            identifier,
            type,
            status,
            severityScore,
            source,
            breachName,
            breachDate,
            compromisedData,
            scanDate
        } = data;

        const [result] = await pool.execute(
            `INSERT INTO attacks
            (identifier,type,status,severityScore,source,breachName,breachDate,compromisedData,scanDate)
            VALUES (?,?,?,?,?,?,?,?,?)`,
            [
                identifier || null,
                type || null,
                status || null,
                severityScore || 0,
                source || null,
                breachName || null,
                breachDate || null,
                compromisedData || null,
                scanDate ? new Date(scanDate).toISOString() : new Date().toISOString()
            ]
        );

        return result.insertId;
    }

    static async getAll() {

        const [rows] = await pool.execute(
            `SELECT * FROM attacks ORDER BY scanDate DESC`
        );

        return rows;
    }

    static async search(query) {

        const term = `%${query}%`;

        const [rows] = await pool.execute(
            `SELECT * FROM attacks
             WHERE identifier LIKE ?
             OR type LIKE ?
             ORDER BY scanDate DESC`,
            [term, term]
        );

        return rows;
    }

    static async deleteById(id) {

        await pool.execute(
            "DELETE FROM attacks WHERE id = ?",
            [id]
        );

    }
}

module.exports = Attack;


class Utils {

    // Helper functions

    static queryReject(tracker, msg) {
        tracker.on('query', function checkResult(query) {
            query.reject(msg ? msg : 'Error occured while running SQL query');
        });
    }

    static queryResponse(tracker, data) {
        tracker.on('query', function checkResult(query) {
            query.response(data);
        });
    }

    static async callAsync(fn) {
        let f = () => { };

        try {
            await fn();
        } catch (e) {
            f = () => { throw e; };
        }

        return f;
    }
}

module.exports = Utils;

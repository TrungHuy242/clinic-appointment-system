/**
 * Mock HTTP layer – không gọi server thật.
 * mockRequest({ data, delayMs, shouldFail, errorMsg })
 *   -> Promise.resolve(data) sau delayMs
 *   -> Promise.reject(Error(errorMsg)) nếu shouldFail=true
 */
export function mockRequest({ data, delayMs = 400, shouldFail = false, errorMsg = "Lỗi server (mock)" }) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldFail) {
                reject(new Error(errorMsg));
            } else {
                resolve(data);
            }
        }, delayMs);
    });
}

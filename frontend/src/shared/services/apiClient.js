import { repairMojibakeDeep, repairMojibakeText } from "../utils/text";
import { API_BASE_URL } from "./endpoints";

export const apiClient = {
  baseUrl: API_BASE_URL,
};

export function mockRequest({
  data,
  delayMs = 400,
  shouldFail = false,
  errorMsg = "Lỗi máy chủ (mock)",
}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(repairMojibakeText(errorMsg)));
      } else {
        resolve(repairMojibakeDeep(data));
      }
    }, delayMs);
  });
}
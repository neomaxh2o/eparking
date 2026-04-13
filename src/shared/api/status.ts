import { API_LEGACY_INVENTORY } from '@/shared/constants/api_legacy_inventory';

export function getLegacyApiStatus(route: keyof typeof API_LEGACY_INVENTORY) {
return API_LEGACY_INVENTORY[route];
}

// طبقة المورّدين: كل مورّد يطبّق نفس الواجهة، فتبديل mock بـ TBO لا يغيّر أي route.
//   search(params, factor) · hotel(id) · suggest(q) · priceCheck({hotelId, roomId, rateId})
import { DESTINATIONS, HOTELS, hotelById } from '../../../client/src/data/catalog.js';
import { searchHotels, suggest } from '../../../client/src/lib/search.js';
import { config } from '../config.js';
import { tboProvider } from './tbo.js';

const mockProvider = {
  name: 'mock',
  async search(params, factor) { return searchHotels({ hotels: HOTELS, destinations: DESTINATIONS }, params, factor); },
  async hotel(id) { return hotelById[id] || null; },
  async suggest(q) { return suggest(q, { hotels: HOTELS, destinations: DESTINATIONS }); },
  // السعر يُعاد حسابه في الخادم دائماً — لا نثق بأي سعر قادم من المتصفح
  async priceCheck({ hotelId, roomId, rateId }) {
    const rate = hotelById[hotelId]?.rooms.find((r) => r.id === roomId)?.rates.find((r) => r.id === rateId);
    return rate ? { netNightly: rate.price, refundable: rate.refundable, meal: rate.meal } : null;
  },
};

export const provider = config.supplier === 'tbo' ? tboProvider : mockProvider;
export const markupFactor = () => 1 + config.markupPct / 100;

// MyFatoorah: ننشئ فاتورة ونحوّل العميل لصفحة الدفع المستضافة عندهم،
// فلا تمر بيانات البطاقة على خوادمنا إطلاقاً (يقلّل متطلبات PCI‑DSS).
// راجع التوثيق الرسمي لتأكيد الحقول قبل الإنتاج: https://docs.myfatoorah.com
import { config } from '../config.js';

async function call(path, body) {
  const { baseUrl, apiKey } = config.myfatoorah;
  if (!apiKey) throw Object.assign(new Error('MyFatoorah API key is not configured'), { status: 503 });
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.IsSuccess) throw Object.assign(new Error(`MyFatoorah ${path} failed`), { status: 502 });
  return json.Data;
}

export const myfatoorah = {
  enabled: () => Boolean(config.myfatoorah.apiKey),

  async createInvoice({ ref, amount, currency, customer, lang = 'ar' }) {
    const data = await call('/v2/SendPayment', {
      NotificationOption: 'LNK',
      InvoiceValue: amount,
      DisplayCurrencyIso: currency,
      CustomerName: customer.name,
      CustomerEmail: customer.email,
      CustomerReference: ref,
      Language: lang,
      CallBackUrl: `${config.siteUrl}/#/booking/${ref}`,
      ErrorUrl: `${config.siteUrl}/#/booking/${ref}?failed=1`,
    });
    return { invoiceId: data.InvoiceId, paymentUrl: data.InvoiceURL };
  },

  // لا نعتمد على ما يرسله المتصفح أو الـ webhook وحده: نسأل MyFatoorah مباشرة عن حالة الفاتورة
  async isPaid(invoiceId, expectedAmount) {
    const data = await call('/v2/GetPaymentStatus', { Key: String(invoiceId), KeyType: 'InvoiceId' });
    return data.InvoiceStatus === 'Paid' && Number(data.InvoiceValue) >= expectedAmount;
  },
};

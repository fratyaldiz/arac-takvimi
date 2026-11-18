import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { reportFileName, vehicleReportHtml, type VehicleReportInput } from './vehicleReport';

export type PdfResult = { ok: true; uri: string } | { ok: false; reason: 'error' | 'nosharing' };

/**
 * Aracın geçmişini PDF'e basar ve paylaşım sayfasını açar. Dosya önbellekte
 * tutulur; kullanıcı paylaşım ekranından kaydeder ya da gönderir.
 */
export async function shareVehicleReport(input: VehicleReportInput): Promise<PdfResult> {
  try {
    const { uri } = await Print.printToFileAsync({ html: vehicleReportHtml(input) });
    // Paylaşım sayfasında anlamlı bir ad görünsün diye dosya yeniden adlandırılır.
    const target = new File(Paths.cache, reportFileName(input.vehicle, input.today));
    if (target.exists) target.delete();
    new File(uri).move(target);

    if (!(await Sharing.isAvailableAsync())) return { ok: false, reason: 'nosharing' };
    await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', dialogTitle: 'Araç raporu' });
    return { ok: true, uri: target.uri };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

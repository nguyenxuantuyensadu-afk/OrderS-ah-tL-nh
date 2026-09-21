import { MenuItem, PaymentSettings, PreparationOptionsSettings } from './types';

export const defaultMenu: MenuItem[] = [
  { id: '1', name: 'Cà phê đen', price: 20000, category: 'Cà phê', hasOptions: true },
  { id: '2', name: 'Cà phê sữa đá', price: 25000, category: 'Cà phê', hasOptions: true },
  { id: '3', name: 'Bạc xỉu', price: 25000, category: 'Cà phê', hasOptions: true },
  { id: '4', name: 'Cà phê muối', price: 30000, category: 'Cà phê', hasOptions: true },
  { id: '5', name: 'Trà đào cam sả', price: 35000, category: 'Trà', hasOptions: true },
  { id: '6', name: 'Trà vải', price: 35000, category: 'Trà', hasOptions: true },
  { id: '7', name: 'Trà ô long sen vàng', price: 40000, category: 'Trà', hasOptions: true },
  { id: '8', name: 'Trà sữa trân châu', price: 30000, category: 'Trà sữa', hasOptions: true },
  { id: '9', name: 'Sinh tố bơ', price: 40000, category: 'Sinh tố', hasOptions: true },
  { id: '10', name: 'Nước ép cam', price: 35000, category: 'Nước ép', hasOptions: true },
  { id: '11', name: 'Bánh mì thịt nướng', price: 25000, category: 'Đồ ăn nhẹ', hasOptions: false },
  { id: '12', name: 'Hướng dương', price: 15000, category: 'Đồ ăn nhẹ', hasOptions: false },
];

export const initialMenu = defaultMenu;

export const defaultPaymentSettings: PaymentSettings = {
  bankId: 'MB',
  bankName: 'MBBank (Quân Đội)',
  accountNo: '0988888888',
  accountName: 'QUAN POS MINI',
  qrType: 'vietqr',
  qrImageUrl: '',
  notePrefix: 'DH',
};

export const VIETNAMESE_BANKS = [
  { id: 'MB', name: 'MBBank (Ngân hàng Quân Đội)' },
  { id: 'VCB', name: 'Vietcombank (Ngoại thương Việt Nam)' },
  { id: 'TCB', name: 'Techcombank (Kỹ Thương)' },
  { id: 'ICB', name: 'VietinBank (Công Thương)' },
  { id: 'BIDV', name: 'BIDV (Đầu tư & Phát triển)' },
  { id: 'ACB', name: 'ACB (Á Châu)' },
  { id: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { id: 'TPB', name: 'TPBank (Tiên Phong)' },
  { id: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
  { id: 'HDB', name: 'HDBank (Phát triển TP.HCM)' },
  { id: 'MSB', name: 'MSB (Hàng Hải)' },
  { id: 'VIB', name: 'VIB (Quốc Tế)' },
  { id: 'SHB', name: 'SHB (Sài Gòn - Hà Nội)' },
  { id: 'OCB', name: 'OCB (Phương Đông)' },
];

export const defaultPreparationOptions: PreparationOptionsSettings = {
  sweeteners: [
    { label: 'Đường cát', desc: 'Đường mía tiêu chuẩn' },
    { label: 'Đường kiêng', desc: 'Ít calo / Ăn kiêng' },
    { label: 'Sữa đặc', desc: 'Đậm đà truyền thống' },
    { label: 'Mật ong', desc: 'Ngọt thanh tự nhiên' },
    { label: 'Không đường', desc: 'Nguyên vị 0 đường' },
  ],
  milkTemps: [
    { label: 'Đá (Lạnh)', type: 'cold' },
    { label: 'Nóng', type: 'hot' },
    { label: 'Ấm', type: 'warm' },
    { label: 'Không sữa', type: 'none' },
  ],
  sweetnessLevels: [
    { label: '100% ngọt', desc: 'Ngọt chuẩn quán' },
    { label: '70% ngọt', desc: 'Hơi ngọt' },
    { label: '50% ngọt', desc: 'Vừa phải' },
    { label: '30% ngọt (Ít ngọt)', desc: 'Ít ngọt thanh' },
    { label: '0% (Không ngọt)', desc: 'Không bỏ ngọt' },
  ],
  quickNotes: ['Ít đá', 'Không đá', 'Nhiều đá', 'Đá riêng', 'Ly giấy', 'Đậm vị'],
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

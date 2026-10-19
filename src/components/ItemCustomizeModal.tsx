import React, { useState, useEffect } from 'react';
import { MenuItem, ItemOptions, PreparationOptionsSettings, itemSupportsSizes } from '../types';
import { formatCurrency, defaultPreparationOptions } from '../data';
import { X, Check, Flame, Snowflake, Plus, Minus } from 'lucide-react';

interface ItemCustomizeModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItem, options: ItemOptions, quantity: number) => void;
  initialOptions?: ItemOptions;
  initialQuantity?: number;
  optionsSettings?: PreparationOptionsSettings;
}

export const SWEETENER_CHOICES = defaultPreparationOptions.sweeteners;
export const MILK_TEMP_CHOICES = defaultPreparationOptions.milkTemps;
export const SWEETNESS_CHOICES = defaultPreparationOptions.sweetnessLevels;

export default function ItemCustomizeModal({
  item,
  isOpen,
  onClose,
  onConfirm,
  initialOptions,
  initialQuantity = 1,
  optionsSettings = defaultPreparationOptions,
}: ItemCustomizeModalProps) {
  const sweeteners = optionsSettings?.sweeteners?.length ? optionsSettings.sweeteners : defaultPreparationOptions.sweeteners;
  const milkTemps = optionsSettings?.milkTemps?.length ? optionsSettings.milkTemps : defaultPreparationOptions.milkTemps;
  const sweetnessLevels = optionsSettings?.sweetnessLevels?.length ? optionsSettings.sweetnessLevels : defaultPreparationOptions.sweetnessLevels;
  const quickNotes = optionsSettings?.quickNotes?.length ? optionsSettings.quickNotes : defaultPreparationOptions.quickNotes;

  const defaultSweetener = sweeteners[0]?.label || 'Đường cát';
  const defaultMilkTemp = milkTemps[0]?.label || 'Đá (Lạnh)';
  const defaultSweetness = sweetnessLevels[0]?.label || '100% ngọt';

  const hasSizes = itemSupportsSizes(item);
  const priceM = item?.price || 0;
  const priceL = item?.priceL || (priceM + 5000);

  const [size, setSize] = useState<'M' | 'L'>('M');
  const [sweetener, setSweetener] = useState<string>(defaultSweetener);
  const [milkTemp, setMilkTemp] = useState<string>(defaultMilkTemp);
  const [sweetness, setSweetness] = useState<string>(defaultSweetness);
  const [itemNote, setItemNote] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (isOpen && item) {
      if (initialOptions) {
        setSize(initialOptions.size === 'L' ? 'L' : 'M');
        setSweetener(initialOptions.sweetener || defaultSweetener);
        setMilkTemp(initialOptions.milkTemp || defaultMilkTemp);
        setSweetness(initialOptions.sweetness || defaultSweetness);
        setItemNote(initialOptions.itemNote || '');
      } else {
        setSize('M');
        const isCoffee = item.category.toLowerCase().includes('cà phê') || item.name.toLowerCase().includes('cà phê');
        const condensedMilkOption = sweeteners.find(s => s.label.toLowerCase().includes('sữa đặc'))?.label;
        if (isCoffee && item.name.toLowerCase().includes('sữa') && condensedMilkOption) {
          setSweetener(condensedMilkOption);
        } else {
          setSweetener(defaultSweetener);
        }
        setMilkTemp(defaultMilkTemp);
        setSweetness(defaultSweetness);
        setItemNote('');
      }
      setQuantity(initialQuantity || 1);
    }
  }, [isOpen, item, initialOptions, initialQuantity, defaultSweetener, defaultMilkTemp, defaultSweetness, sweeteners]);

  if (!isOpen || !item) return null;

  const currentUnitPrice = (hasSizes && size === 'L') ? priceL : priceM;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const options: ItemOptions = {
      sweetener,
      milkTemp,
      sweetness,
    };
    if (hasSizes) {
      options.size = size;
    }
    const trimmedNote = itemNote.trim();
    if (trimmedNote) {
      options.itemNote = trimmedNote;
    }
    const finalItem: MenuItem = {
      ...item,
      price: currentUnitPrice,
    };
    onConfirm(finalItem, options, quantity);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-150"
      >
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-[#e6d5c2] flex items-center justify-between bg-[#3b2415] text-white shrink-0">
          <div className="min-w-0 pr-2 flex items-baseline gap-2">
            <h3 className="text-base font-black truncate">{item.name}</h3>
            <span className="text-xs font-bold text-[#e6d5c2] shrink-0 font-mono tabular-nums">
              {formatCurrency(currentUnitPrice)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/15 rounded-lg transition-colors text-white/80 hover:text-white shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Streamlined Form Body */}
        <form id="customize-form" onSubmit={handleSubmit} className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-[#faf8f5]">
          
          {/* 1. Size Selection (Compact Segmented Row) */}
          {hasSizes && (
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5f5043] mb-1.5">
                Kích cỡ ly
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSize('M')}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all touch-manipulation ${
                    size === 'M'
                      ? 'border-[#54331e] bg-[#54331e] text-white shadow-xs'
                      : 'border-[#e6d5c2] bg-white text-[#342a22] hover:border-[#b8a693]'
                  }`}
                >
                  <span>Size M (Vừa)</span>
                  <span className="font-mono tabular-nums font-extrabold">{formatCurrency(priceM)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSize('L')}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all touch-manipulation ${
                    size === 'L'
                      ? 'border-[#54331e] bg-[#54331e] text-white shadow-xs'
                      : 'border-[#e6d5c2] bg-white text-[#342a22] hover:border-[#b8a693]'
                  }`}
                >
                  <span>Size L (+{formatCurrency(priceL - priceM)})</span>
                  <span className="font-mono tabular-nums font-extrabold">{formatCurrency(priceL)}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Milk / Temperature */}
          {milkTemps.length > 0 && (
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5f5043] mb-1.5">
                Nhiệt độ / Đá
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {milkTemps.map((choice) => {
                  const isSelected = milkTemp === choice.label;
                  const isCold = choice.type === 'cold' || choice.label.toLowerCase().includes('đá') || choice.label.toLowerCase().includes('lạnh');
                  const isHot = choice.type === 'hot' || choice.label.toLowerCase().includes('nóng') || choice.type === 'warm' || choice.label.toLowerCase().includes('ấm');

                  return (
                    <button
                      key={choice.label}
                      type="button"
                      onClick={() => setMilkTemp(choice.label)}
                      className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-manipulation whitespace-nowrap ${
                        isSelected
                          ? 'border-[#54331e] bg-[#54331e] text-white shadow-xs'
                          : 'border-[#e6d5c2] bg-white text-[#342a22] hover:border-[#b8a693]'
                      }`}
                    >
                      {isCold && <Snowflake size={13} className={isSelected ? 'text-blue-200' : 'text-blue-500'} />}
                      {isHot && <Flame size={13} className={isSelected ? 'text-amber-200' : 'text-orange-500'} />}
                      <span className="truncate">{choice.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Sweetener & Sweetness */}
          <div className="space-y-3">
            {sweeteners.length > 0 && (
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5f5043] mb-1.5">
                  Chất làm ngọt
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {sweeteners.map((choice) => {
                    const isSelected = sweetener === choice.label;
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        onClick={() => setSweetener(choice.label)}
                        className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-1 transition-all touch-manipulation ${
                          isSelected
                            ? 'border-[#54331e] bg-[#54331e] text-white shadow-xs'
                            : 'border-[#e6d5c2] bg-white text-[#342a22] hover:border-[#b8a693]'
                        }`}
                      >
                        <span className="truncate">{choice.label}</span>
                        {isSelected && <Check size={13} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sweetnessLevels.length > 0 && (
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5f5043] mb-1.5">
                  Mức độ ngọt
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {sweetnessLevels.map((choice) => {
                    const isSelected = sweetness === choice.label;
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        onClick={() => setSweetness(choice.label)}
                        className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all touch-manipulation whitespace-nowrap ${
                          isSelected
                            ? 'border-[#54331e] bg-[#54331e] text-white shadow-xs'
                            : 'border-[#e6d5c2] bg-white text-[#342a22] hover:border-[#b8a693]'
                        }`}
                      >
                        <span className="truncate">{choice.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Streamlined Item Note */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5f5043] mb-1.5">
              Ghi chú món
            </label>
            <input
              type="text"
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
              placeholder="Ghi chú thêm (VD: ít đá, ly giấy...)"
              className="w-full px-3 py-2 bg-white border border-[#d5c8b8] rounded-xl text-xs sm:text-sm text-[#25150c] placeholder-[#978370] focus:ring-2 focus:ring-[#7c5434] outline-none"
            />
            {quickNotes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {quickNotes.map((chip) => {
                  const isActive = itemNote.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          setItemNote(prev => prev.replace(chip, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim());
                        } else {
                          setItemNote(prev => prev ? `${prev}, ${chip}` : chip);
                        }
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        isActive
                          ? 'bg-[#54331e] text-white'
                          : 'bg-white text-[#5f5043] border border-[#e6d5c2] hover:bg-[#f3eae0]'
                      }`}
                    >
                      + {chip}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </form>

        {/* Integrated Quantity & Submit Footer */}
        <div className="p-3 sm:p-3.5 border-t border-[#e6d5c2] bg-white flex items-center gap-2.5 shrink-0">
          {/* Inline Quantity Stepper */}
          <div className="flex items-center bg-[#faf6f1] border border-[#e6d5c2] rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-white hover:bg-[#f3eae0] text-[#342a22] font-bold flex items-center justify-center transition-colors active:scale-95"
              aria-label="Giảm số lượng"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center font-black text-sm text-[#25150c] font-mono tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg bg-white hover:bg-[#f3eae0] text-[#342a22] font-bold flex items-center justify-center transition-colors active:scale-95"
              aria-label="Tăng số lượng"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Primary Confirm Button */}
          <button
            type="submit"
            form="customize-form"
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#54331e] hover:bg-[#3b2415] active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-md shadow-[#54331e]/20 transition-all flex items-center justify-between touch-manipulation min-h-[42px]"
          >
            <span>{initialOptions ? 'Cập nhật món' : 'Thêm vào đơn'}</span>
            <span className="font-mono tabular-nums bg-white/15 px-2 py-0.5 rounded-lg text-xs">
              {formatCurrency(currentUnitPrice * quantity)}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

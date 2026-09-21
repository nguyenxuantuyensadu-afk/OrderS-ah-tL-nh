import React, { useState, useEffect } from 'react';
import { MenuItem, ItemOptions, PreparationOptionsSettings, itemSupportsSizes } from '../types';
import { formatCurrency, defaultPreparationOptions } from '../data';
import { X, Check, Flame, Snowflake, Sparkles } from 'lucide-react';

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

  // Initialize or reset when item changes
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
        // Defaults based on category
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-bold">
                {item.category}
              </span>
              <span className="text-white/80 text-xs">Tùy chọn pha chế</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black truncate mt-0.5">{item.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form id="customize-form" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          
          {/* 0. Chọn Size (Size M & Size L cho Matcha & Cà phê) */}
          {hasSizes && (
            <div className="bg-amber-50/60 p-3 sm:p-3.5 rounded-2xl border border-amber-200/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  <span>Chọn Size (Kích cỡ)</span>
                </label>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                  Bắt buộc
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Size M */}
                <button
                  type="button"
                  onClick={() => setSize('M')}
                  className={`p-3 rounded-xl border-2 text-left transition-all touch-manipulation relative flex flex-col justify-between ${
                    size === 'M'
                      ? 'border-amber-500 bg-white text-amber-950 shadow-xs ring-2 ring-amber-400/20'
                      : 'border-gray-200 bg-white/70 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                        size === 'M' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        M
                      </span>
                      <span className="font-extrabold text-xs sm:text-sm">Size M (Vừa)</span>
                    </div>
                    {size === 'M' && <Check size={16} className="text-amber-600 shrink-0" />}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between pt-1.5 border-t border-gray-100">
                    <span className="text-[11px] text-gray-400 font-medium">Tiêu chuẩn</span>
                    <span className="text-xs font-black text-amber-700">{formatCurrency(priceM)}</span>
                  </div>
                </button>

                {/* Size L */}
                <button
                  type="button"
                  onClick={() => setSize('L')}
                  className={`p-3 rounded-xl border-2 text-left transition-all touch-manipulation relative flex flex-col justify-between ${
                    size === 'L'
                      ? 'border-purple-500 bg-white text-purple-950 shadow-xs ring-2 ring-purple-400/20'
                      : 'border-gray-200 bg-white/70 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                        size === 'L' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        L
                      </span>
                      <span className="font-extrabold text-xs sm:text-sm">Size L (Lớn)</span>
                    </div>
                    {size === 'L' && <Check size={16} className="text-purple-600 shrink-0" />}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between pt-1.5 border-t border-gray-100">
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded">
                      +{formatCurrency(priceL - priceM)}
                    </span>
                    <span className="text-xs font-black text-purple-700">{formatCurrency(priceL)}</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 1. Sữa Nóng / Lạnh */}
          {milkTemps.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>1. Sữa / Nhiệt độ phục vụ</span>
                </label>
                <span className="text-[11px] text-gray-400 font-semibold">Bắt buộc</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {milkTemps.map((choice) => {
                  const isSelected = milkTemp === choice.label;
                  const isCold = choice.type === 'cold' || choice.label.toLowerCase().includes('đá') || choice.label.toLowerCase().includes('lạnh');
                  const isHot = choice.type === 'hot' || choice.label.toLowerCase().includes('nóng');
                  const isWarm = choice.type === 'warm' || choice.label.toLowerCase().includes('ấm');

                  return (
                    <button
                      key={choice.label}
                      type="button"
                      onClick={() => setMilkTemp(choice.label)}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all touch-manipulation ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 text-amber-900 shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {isCold && <Snowflake size={16} className={isSelected ? 'text-blue-600' : 'text-blue-400'} />}
                      {(isHot || isWarm) && <Flame size={16} className={isSelected ? 'text-orange-600' : 'text-orange-400'} />}
                      {!isCold && !isHot && !isWarm && <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-600 font-bold">•</span>}
                      <span className="truncate">{choice.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Chất làm ngọt */}
          {sweeteners.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>2. Chất làm ngọt</span>
                </label>
                <span className="text-[11px] text-gray-400 font-semibold">Tùy chọn</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sweeteners.map((choice) => {
                  const isSelected = sweetener === choice.label;
                  return (
                    <button
                      key={choice.label}
                      type="button"
                      onClick={() => setSweetener(choice.label)}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all touch-manipulation ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 text-amber-900 shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold truncate">{choice.label}</p>
                        {isSelected && <Check size={14} className="text-amber-600 shrink-0" />}
                      </div>
                      {choice.desc && <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{choice.desc}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Độ ngọt */}
          {sweetnessLevels.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>3. Mức độ ngọt</span>
                </label>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  {sweetness}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sweetnessLevels.map((choice) => {
                  const isSelected = sweetness === choice.label;
                  return (
                    <button
                      key={choice.label}
                      type="button"
                      onClick={() => setSweetness(choice.label)}
                      className={`p-2 rounded-xl border-2 text-left transition-all touch-manipulation ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 text-amber-900 shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{choice.label}</span>
                        {isSelected && <Check size={14} className="text-amber-600 shrink-0" />}
                      </div>
                      {choice.desc && <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{choice.desc}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Ghi chú riêng cho món */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700">
                Ghi chú thêm cho món
              </label>
              <span className="text-[10px] text-gray-400 font-medium">Bấm chọn nhanh hoặc nhập tay</span>
            </div>
            
            {/* Quick chips */}
            {quickNotes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
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
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                        isActive
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      + {chip}
                    </button>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
              placeholder="VD: Không lấy đá, cho vào ly giấy, ít cà phê..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
            />
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <div>
              <p className="text-xs font-bold text-gray-700">Số lượng ly / phần</p>
              <p className="text-[11px] text-gray-400">Đơn giá: {formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-sm"
              >
                -
              </button>
              <span className="w-8 text-center font-black text-sm text-gray-800">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 shrink-0">
          <div className="leading-tight">
            <span className="text-[11px] text-gray-500 font-medium">
              {hasSizes ? `Đơn giá (${size === 'L' ? 'Size L' : 'Size M'}): ${formatCurrency(currentUnitPrice)}` : 'Tổng tiền món:'}
            </span>
            <p className="text-lg sm:text-xl font-black text-amber-600">
              {formatCurrency(currentUnitPrice * quantity)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-xs sm:text-sm text-gray-600 bg-white hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                const isCoffee = item.category.toLowerCase().includes('cà phê') || item.name.toLowerCase().includes('cà phê');
                const condensedMilkOption = sweeteners.find(s => s.label.toLowerCase().includes('sữa đặc'))?.label;
                const defSweet = (isCoffee && item.name.toLowerCase().includes('sữa') && condensedMilkOption) ? condensedMilkOption : defaultSweetener;
                const finalOptions: ItemOptions = { 
                  sweetener: defSweet, 
                  milkTemp: defaultMilkTemp, 
                  sweetness: defaultSweetness 
                };
                if (hasSizes) {
                  finalOptions.size = size;
                }
                const finalItem: MenuItem = {
                  ...item,
                  price: currentUnitPrice
                };
                onConfirm(finalItem, finalOptions, quantity);
                onClose();
              }}
              title="Thêm với công thức chuẩn"
              className="hidden sm:inline-flex px-3.5 py-2.5 rounded-xl border border-amber-300 font-bold text-xs sm:text-sm text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              Thêm chuẩn
            </button>
            <button
              type="submit"
              form="customize-form"
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-200 transition-all flex items-center gap-1.5 touch-manipulation"
            >
              <Sparkles size={16} />
              <span>Xác nhận thêm món</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

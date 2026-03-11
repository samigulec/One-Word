// StreakHeatmap.tsx -- GitHub-style aktivite heatmap takvimi
// Son 12 haftanin gunluk ogrenme aktivitesini gosterir

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LearnedWord } from '../types';

// Heatmap icin renk yogunluklari
const COLORS = {
  empty: 'rgba(255,255,255,0.06)',     // Bos gun
  level1: 'rgba(139,92,246,0.3)',       // 1 kelime
  level2: 'rgba(139,92,246,0.6)',       // 2 kelime
  level3: 'rgba(139,92,246,0.9)',       // 3+ kelime
} as const;

// Kare boyutu ve bosluk
const CELL_SIZE = 10;
const CELL_GAP = 2;
const TOTAL_WEEKS = 12;
const DAYS_COUNT = TOTAL_WEEKS * 7; // 84 gun

// Haftanin gun etiketleri (Pazartesi baslangicli)
const DAY_LABELS = ['M', '', 'W', '', 'F', '', ''];

// Ay isimleri (kisa)
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type StreakHeatmapProps = {
  learnedWords: LearnedWord[];
};

/**
 * Verilen tarihi YYYY-MM-DD formatina cevirir
 */
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Gun bazinda kelime sayisini hesaplar
 */
const buildWordCountMap = (learnedWords: LearnedWord[]): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const w of learnedWords) {
    // learnedDate: "2026-03-09" formatinda
    const date = w.learnedDate;
    if (date) {
      map[date] = (map[date] || 0) + 1;
    }
  }
  return map;
};

/**
 * Kelime sayisina gore renk dondurur
 */
const getColor = (count: number): string => {
  if (count === 0) return COLORS.empty;
  if (count === 1) return COLORS.level1;
  if (count === 2) return COLORS.level2;
  return COLORS.level3;
};

/**
 * Son 84 gunun tarih bilgilerini hesaplar.
 * Her bir tarih icin: tarih stringi, haftanin gunu (0=Pzt, 6=Paz), ay indexi
 */
const buildDateGrid = (): { date: string; dayOfWeek: number; month: number }[] => {
  const today = new Date();
  const grid: { date: string; dayOfWeek: number; month: number }[] = [];

  for (let i = DAYS_COUNT - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Pazartesi=0 olacak sekilde ayarla (JS'de Pazar=0, biz Pazartesi=0 istiyoruz)
    const jsDow = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dow = jsDow === 0 ? 6 : jsDow - 1; // 0=Mon, ..., 6=Sun
    grid.push({
      date: formatDate(d),
      dayOfWeek: dow,
      month: d.getMonth(),
    });
  }

  return grid;
};

/**
 * Tarihleri haftalik sutunlara ayirir
 */
const groupByWeek = (
  grid: { date: string; dayOfWeek: number; month: number }[]
): { date: string; dayOfWeek: number; month: number }[][] => {
  const weeks: { date: string; dayOfWeek: number; month: number }[][] = [];
  let currentWeek: { date: string; dayOfWeek: number; month: number }[] = [];

  for (const item of grid) {
    // Yeni hafta basladiysa (Pazartesi) ve onceki hafta doluysa
    if (item.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(item);
  }
  // Son haftayi da ekle
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
};

const StreakHeatmap: React.FC<StreakHeatmapProps> = ({ learnedWords }) => {
  // Tum hesaplamalari memoize et
  const { weeks, wordCountMap, monthLabels } = useMemo(() => {
    const dateGrid = buildDateGrid();
    const wks = groupByWeek(dateGrid);
    const wcMap = buildWordCountMap(learnedWords);

    // Ust taraftaki ay etiketlerini hesapla
    // Her haftanin ilk gunune bakar, ay degisimlerinde etiket gosterir
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;

    wks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay && firstDay.month !== lastMonth) {
        labels.push({ weekIndex, label: MONTH_NAMES[firstDay.month] });
        lastMonth = firstDay.month;
      }
    });

    return { weeks: wks, wordCountMap: wcMap, monthLabels: labels };
  }, [learnedWords]);

  // Ay etiketi genisligi hesaplama
  const dayLabelWidth = 16;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aktivite</Text>

      {/* Ay etiketleri */}
      <View style={[styles.monthRow, { marginLeft: dayLabelWidth + 2 }]}>
        {monthLabels.map((ml, i) => (
          <Text
            key={`month-${i}`}
            style={[
              styles.monthLabel,
              { left: ml.weekIndex * (CELL_SIZE + CELL_GAP) },
            ]}
          >
            {ml.label}
          </Text>
        ))}
      </View>

      {/* Grid: gun etiketleri + kareler */}
      <View style={styles.gridContainer}>
        {/* Sol taraftaki gun etiketleri */}
        <View style={[styles.dayLabelsColumn, { width: dayLabelWidth }]}>
          {DAY_LABELS.map((label, i) => (
            <View key={`day-${i}`} style={styles.dayLabelCell}>
              <Text style={styles.dayLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Haftalik sutunlar */}
        <View style={styles.weeksContainer}>
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.weekColumn}>
              {/* Haftanin basindaki bos gunleri doldur */}
              {week[0] && week[0].dayOfWeek > 0 &&
                Array.from({ length: week[0].dayOfWeek }).map((_, emptyIdx) => (
                  <View
                    key={`empty-${weekIndex}-${emptyIdx}`}
                    style={[styles.cell, { backgroundColor: 'transparent' }]}
                  />
                ))
              }
              {week.map((day) => {
                const count = wordCountMap[day.date] || 0;
                return (
                  <View
                    key={day.date}
                    style={[styles.cell, { backgroundColor: getColor(count) }]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Alt kisimda renk aciklamasi */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Az</Text>
        <View style={[styles.legendCell, { backgroundColor: COLORS.empty }]} />
        <View style={[styles.legendCell, { backgroundColor: COLORS.level1 }]} />
        <View style={[styles.legendCell, { backgroundColor: COLORS.level2 }]} />
        <View style={[styles.legendCell, { backgroundColor: COLORS.level3 }]} />
        <Text style={styles.legendText}>Cok</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Ana konteyner
  container: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  // Baslik
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  // Ay etiketi satiri
  monthRow: {
    position: 'relative',
    height: 16,
    marginBottom: 4,
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
  },
  // Grid konteyner (etiketler + kareler)
  gridContainer: {
    flexDirection: 'row',
  },
  // Sol gun etiketleri sutunu
  dayLabelsColumn: {
    marginRight: 2,
  },
  dayLabelCell: {
    height: CELL_SIZE,
    marginBottom: CELL_GAP,
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'right',
  },
  // Haftalik sutunlar konteyner
  weeksContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  // Tek hafta sutunu
  weekColumn: {
    marginRight: CELL_GAP,
  },
  // Tek gun karesi
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    marginBottom: CELL_GAP,
  },
  // Renk aciklamasi (legend)
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 3,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.25)',
    marginHorizontal: 2,
  },
  legendCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
});

export default StreakHeatmap;

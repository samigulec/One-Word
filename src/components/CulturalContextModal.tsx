import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ContentItem } from '../types';

// Kulturel baglam, kullanim notu ve eglenceli bilgi icin modal bilesen
type CulturalContextModalProps = {
  visible: boolean;
  word: ContentItem | null;
  onClose: () => void;
};

const CulturalContextModal: React.FC<CulturalContextModalProps> = ({
  visible,
  word,
  onClose,
}) => {
  // Gosterilecek icerik yoksa modali gosterme
  const hasContent = word && (word.culturalContext || word.usageNotes || word.funFact);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Glassmorphism: BlurView ile buzlu cam efekti */}
        <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
          <View style={styles.container}>
            {/* Baslık ve kapat butonu */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{'\u{1F4A1}'} Biliyor muydun?</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {word && hasContent ? (
                <>
                  {/* Kelime basligi */}
                  <View style={styles.wordRow}>
                    {word.emoji && <Text style={styles.wordEmoji}>{word.emoji}</Text>}
                    <Text style={styles.wordText}>{word.target_word}</Text>
                  </View>

                  {/* Kulturel Baglam */}
                  {word.culturalContext && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>{'\u{1F30D}'}</Text>
                        <Text style={styles.sectionTitle}>Cultural Context</Text>
                      </View>
                      <Text style={styles.sectionText}>{word.culturalContext}</Text>
                    </View>
                  )}

                  {/* Kullanim Notlari */}
                  {word.usageNotes && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>{'\u{1F4DD}'}</Text>
                        <Text style={styles.sectionTitle}>Usage Notes</Text>
                      </View>
                      <Text style={styles.sectionText}>{word.usageNotes}</Text>
                    </View>
                  )}

                  {/* Eglenceli Bilgi */}
                  {word.funFact && (
                    <View style={[styles.section, styles.funFactSection]}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>{'\u{2728}'}</Text>
                        <Text style={styles.sectionTitle}>Fun Fact</Text>
                      </View>
                      <Text style={[styles.sectionText, styles.funFactText]}>
                        {word.funFact}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                // Icerik yoksa bilgilendirme
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>{'\u{1F50D}'}</Text>
                  <Text style={styles.emptyText}>
                    Bu kelime icin henuz kulturel baglam bilgisi eklenmemis.
                  </Text>
                  <Text style={styles.emptyHint}>
                    Yakin zamanda eklenecek!
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  // BlurView kapsayicisi -- alttan gelen modal icin konumlandirilir
  blurContainer: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  // Glassmorphism: yari-seffaf arka plan ve ince kenar
  container: {
    backgroundColor: 'rgba(15, 10, 46, 0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  wordEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  wordText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
  funFactSection: {
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderColor: 'rgba(251,191,36,0.15)',
  },
  funFactText: {
    color: 'rgba(251,191,36,0.9)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
});

export default CulturalContextModal;

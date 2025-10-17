import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../../hooks/useLocalization';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  content: HelpContent[];
}

interface HelpContent {
  type: 'text' | 'list' | 'colorCode';
  content: string | string[] | ColorCodeItem[];
}

interface ColorCodeItem {
  color: string;
  label: string;
  description: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const HelpModal: React.FC<HelpModalProps> = ({
  visible,
  onClose,
  title,
  content,
}) => {
  const { t, isRTL } = useLocalization();

  const renderContent = (item: HelpContent, index: number) => {
    switch (item.type) {
      case 'text':
        return (
          <Text key={index} style={[styles.contentText, isRTL && styles.rtlText]}>
            {item.content as string}
          </Text>
        );
      
      case 'list':
        return (
          <View key={index} style={styles.listContainer}>
            {(item.content as string[]).map((listItem, listIndex) => (
              <View key={listIndex} style={[styles.listItem, isRTL && styles.rtlListItem]}>
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.listText, isRTL && styles.rtlText]}>
                  {listItem}
                </Text>
              </View>
            ))}
          </View>
        );
      
      case 'colorCode':
        return (
          <View key={index} style={styles.colorCodeContainer}>
            {(item.content as ColorCodeItem[]).map((colorItem, colorIndex) => (
              <View key={colorIndex} style={[styles.colorCodeItem, isRTL && styles.rtlColorCodeItem]}>
                <View style={[styles.colorCircle, { backgroundColor: colorItem.color }]} />
                <View style={styles.colorTextContainer}>
                  <Text style={[styles.colorLabel, isRTL && styles.rtlText]}>
                    {colorItem.label}
                  </Text>
                  <Text style={[styles.colorDescription, isRTL && styles.rtlText]}>
                    {colorItem.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.header, isRTL && styles.rtlHeader]}>
          <Text style={[styles.title, isRTL && styles.rtlText]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {content.map((item, index) => renderContent(item, index))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  rtlHeader: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  listContainer: {
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rtlListItem: {
    flexDirection: 'row-reverse',
  },
  bullet: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
    marginTop: 2,
  },
  listText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    flex: 1,
  },
  colorCodeContainer: {
    marginBottom: 16,
  },
  colorCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  rtlColorCodeItem: {
    flexDirection: 'row-reverse',
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  colorTextContainer: {
    flex: 1,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  colorDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
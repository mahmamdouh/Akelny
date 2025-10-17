import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PickerOption {
  label: string;
  value: string;
}

interface PickerProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: PickerOption[];
  onValueChange: (value: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
  pickerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
}

const Picker: React.FC<PickerProps> = ({
  label,
  placeholder = 'Select an option',
  value,
  options,
  onValueChange,
  error,
  containerStyle,
  pickerStyle,
  labelStyle,
  errorStyle,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsVisible(false);
  };

  const renderOption = ({ item }: { item: PickerOption }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === value && styles.selectedOption,
      ]}
      onPress={() => handleSelect(item.value)}
    >
      <Text
        style={[
          styles.optionText,
          item.value === value && styles.selectedOptionText,
        ]}
      >
        {item.label}
      </Text>
      {item.value === value && (
        <Ionicons name="checkmark" size={20} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.picker,
          error ? styles.error : null,
          pickerStyle,
        ].filter(Boolean)}
        onPress={() => setIsVisible(true)}
      >
        <Text
          style={[
            styles.pickerText,
            !selectedOption && styles.placeholderText,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color="#8E8E93"
        />
      </TouchableOpacity>
      {error && (
        <Text style={[styles.errorText, errorStyle]}>{error}</Text>
      )}

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label || 'Select Option'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  error: {
    borderColor: '#FF3B30',
  },
  pickerText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  placeholderText: {
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectedOption: {
    backgroundColor: '#F0F8FF',
  },
  optionText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default Picker;
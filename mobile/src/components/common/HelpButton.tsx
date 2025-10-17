import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HelpModal } from './HelpModal';
import { useHelpContent, HelpTopic } from '../../services/helpService';

interface HelpButtonProps {
    helpType: 'ingredient-status' | 'meal-suggestions' | 'pantry-management' | 'calendar' | 'recipe-creation';
    size?: number;
    color?: string;
    style?: any;
}

export const HelpButton: React.FC<HelpButtonProps> = ({
    helpType,
    size = 24,
    color = '#666',
    style,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const helpContent = useHelpContent();

    const getHelpTopic = (): HelpTopic => {
        switch (helpType) {
            case 'ingredient-status':
                return helpContent.getIngredientStatusHelp();
            case 'meal-suggestions':
                return helpContent.getMealSuggestionHelp();
            case 'pantry-management':
                return helpContent.getPantryManagementHelp();
            case 'calendar':
                return helpContent.getCalendarHelp();
            case 'recipe-creation':
                return helpContent.getRecipeCreationHelp();
            default:
                return helpContent.getIngredientStatusHelp();
        }
    };

    const handlePress = () => {
        setModalVisible(true);
    };

    const handleClose = () => {
        setModalVisible(false);
    };

    const topic = getHelpTopic();

    return (
        <>
            <TouchableOpacity
                style={[styles.button, style]}
                onPress={handlePress}
                accessibilityLabel="Help"
                accessibilityHint="Get help information"
            >
                <Ionicons name="help-circle-outline" size={size} color={color} />
            </TouchableOpacity>

            <HelpModal
                visible={modalVisible}
                onClose={handleClose}
                title={topic.title}
                content={topic.content}
            />
        </>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import PantryScreen from '../screens/pantry/PantryScreen';
import SearchScreen from '../screens/search/SearchScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import FavoritesScreen from '../screens/favorites/FavoritesScreen';

// Modal/Detail Screens
import MealDetailScreen from '../screens/meal/MealDetailScreen';
import CreateRecipeScreen from '../screens/meal/CreateRecipeScreen';
import IngredientSearchScreen from '../screens/pantry/IngredientSearchScreen';
import KitchenBrowserScreen from '../screens/search/KitchenBrowserScreen';
import KitchenMealsScreen from '../screens/search/KitchenMealsScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import ShareRecipeScreen from '../screens/community/ShareRecipeScreen';

export type AppTabParamList = {
  HomeTab: undefined;
  PantryTab: undefined;
  SearchTab: undefined;
  CalendarTab: undefined;
  FavoritesTab: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  MealDetail: { mealId: string };
  CreateRecipe: undefined;
  IngredientSearch: undefined;
  KitchenBrowser: undefined;
  KitchenMeals: { kitchenId: string; kitchenName: string };
  Community: undefined;
  ShareRecipe: { mealId?: string };
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const MainTabNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'PantryTab':
              iconName = focused ? 'basket' : 'basket-outline';
              break;
            case 'SearchTab':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'CalendarTab':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'FavoritesTab':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{ tabBarLabel: t('navigation.home') }}
      />
      <Tab.Screen 
        name="PantryTab" 
        component={PantryScreen}
        options={{ tabBarLabel: t('navigation.pantry') }}
      />
      <Tab.Screen 
        name="SearchTab" 
        component={SearchScreen}
        options={{ tabBarLabel: t('navigation.search') }}
      />
      <Tab.Screen 
        name="CalendarTab" 
        component={CalendarScreen}
        options={{ tabBarLabel: t('navigation.calendar') }}
      />
      <Tab.Screen 
        name="FavoritesTab" 
        component={FavoritesScreen}
        options={{ tabBarLabel: t('navigation.favorites') }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        animationDuration: 300,
        gestureDirection: 'horizontal',
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
              easing: require('react-native').Easing.out(require('react-native').Easing.cubic),
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 250,
              easing: require('react-native').Easing.in(require('react-native').Easing.cubic),
            },
          },
        },
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          };
        },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen 
        name="MealDetail" 
        component={MealDetailScreen}
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateY: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.height, 0],
                    }),
                  },
                  {
                    scale: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.7],
                }),
              },
            };
          },
        }}
      />
      <Stack.Screen 
        name="CreateRecipe" 
        component={CreateRecipeScreen}
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateY: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.height, 0],
                    }),
                  },
                ],
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            };
          },
        }}
      />
      <Stack.Screen 
        name="IngredientSearch" 
        component={IngredientSearchScreen}
      />
      <Stack.Screen 
        name="KitchenBrowser" 
        component={KitchenBrowserScreen}
      />
      <Stack.Screen 
        name="KitchenMeals" 
        component={KitchenMealsScreen}
      />
      <Stack.Screen 
        name="Community" 
        component={CommunityScreen}
      />
      <Stack.Screen 
        name="ShareRecipe" 
        component={ShareRecipeScreen}
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
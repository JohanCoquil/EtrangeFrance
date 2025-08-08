import React, { useState } from 'react';
import { View, ScrollView, TextInput, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button, Title, Body, Caption } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const { height: screenHeight } = Dimensions.get('window');

export default function AuthScreen({ navigation }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !username)) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis.');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implémenter la logique d'authentification
      console.log('Authentification:', { email, password, username, isLogin });

        // Simulation d'un délai d'authentification
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Pour l'instant, on navigue directement vers l'app
        navigation.replace('MainTabs', {});
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'authentification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460', '#533483']}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 40,
            minHeight: screenHeight
          }}
        >
          {/* Bouton retour */}
          <Button
            onPress={handleBack}
            variant="secondary"
            size="sm"
            className="self-start mb-8 bg-gray-800/80 border border-gray-600"
          >
            <Body className="text-gray-200">← Retour</Body>
          </Button>

          {/* Titre */}
          <View className="mb-8">
            <Title className="text-white text-center text-3xl font-bold mb-2 tracking-wider">
              {isLogin ? 'CONNEXION' : 'INSCRIPTION'}
            </Title>
            <Caption className="text-blue-200 text-center tracking-widest uppercase">
              Accès aux Agences d'Enquêtes Occultes
            </Caption>
          </View>

          {/* Formulaire */}
          <View className="bg-black/40 rounded-lg p-6 mb-8 border border-blue-500/30">
            {!isLogin && (
              <View className="mb-4">
                <Caption className="text-gray-300 mb-2">Nom d'utilisateur</Caption>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Votre nom d'utilisateur"
                  placeholderTextColor="#9ca3af"
                  className="bg-gray-800/80 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <View className="mb-4">
              <Caption className="text-gray-300 mb-2">Email</Caption>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor="#9ca3af"
                className="bg-gray-800/80 border border-gray-600 rounded-lg px-4 py-3 text-white"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="mb-6">
              <Caption className="text-gray-300 mb-2">Mot de passe</Caption>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                className="bg-gray-800/80 border border-gray-600 rounded-lg px-4 py-3 text-white"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Bouton principal */}
            <Button
              onPress={handleAuth}
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full mb-4 bg-blue-700 border-2 border-blue-500"
            >
              <Title className="text-white text-lg font-semibold">
                {isLoading ? '⏳' : '🔐'} {isLogin ? 'Se connecter' : 'S\'inscrire'}
              </Title>
            </Button>

            {/* Lien de changement de mode */}
            <Button
              onPress={() => setIsLogin(!isLogin)}
              variant="secondary"
              size="sm"
              className="w-full bg-transparent border border-gray-600"
            >
              <Body className="text-gray-300">
                {isLogin ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
              </Body>
            </Button>
          </View>

          {/* Informations de sécurité */}
          <View className="bg-black/20 rounded-lg p-4 border border-gray-600/30">
            <Caption className="text-gray-400 text-center leading-relaxed">
              🔒 Vos données sont protégées par le chiffrement de l'Agence.
              <Body className="text-gray-300 mt-2">
                Les enquêteurs accrédités ont accès aux dossiers classifiés.
              </Body>
            </Caption>
          </View>

          {/* Footer */}
          <View className="mt-8">
            <Caption className="text-gray-500 text-center">
              Système d'authentification sécurisé • Étrange France
            </Caption>
          </View>
        </ScrollView>
      </LinearGradient>
    </LinearGradient>
  );
} 
import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity, TextInput, Switch } from 'react-native';
import Layout from '@/components/ui/Layout';
import Button from '@/components/ui/Button';
import { Trash2, X, Search, AlertTriangle } from 'lucide-react-native';
import { useLogs, useClearLogs, LogEntry } from '@/api/logs';

export default function LogScreen() {
  const [endpointFilter, setEndpointFilter] = useState('');
  const [failuresOnly, setFailuresOnly] = useState(false);
  const { data: logs } = useLogs(endpointFilter, failuresOnly);
  const clearLogs = useClearLogs();
  const [modal, setModal] = useState<{ title: string; content: string } | null>(
    null,
  );

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="p-4 flex-1">
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center bg-white/10 rounded-lg px-3 py-2">
                <Search color="#fff" size={16} />
                <TextInput
                  className="flex-1 text-white ml-2"
                  placeholder="Filtrer par endpoint..."
                  placeholderTextColor="#ffffff80"
                  value={endpointFilter}
                  onChangeText={setEndpointFilter}
                />
              </View>
            </View>
            <TouchableOpacity onPress={() => clearLogs.mutate()}>
              <Trash2 color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between bg-white/10 rounded-lg px-3 py-2">
            <View className="flex-row items-center">
              <AlertTriangle color="#fff" size={16} />
              <Text className="text-white ml-2 text-sm">Échecs uniquement</Text>
            </View>
            <Switch
              value={failuresOnly}
              onValueChange={setFailuresOnly}
              trackColor={{ false: '#ffffff40', true: '#ef4444' }}
              thumbColor={failuresOnly ? '#ffffff' : '#ffffff80'}
            />
          </View>
        </View>
        <ScrollView>
          {logs?.map((log: LogEntry) => (
            <View
              key={log.id}
              className="mb-4 p-3 bg-white/10 rounded"
            >
              <Text className="text-white text-xs mb-1">
                {new Date(log.date).toLocaleString()} - {log.method} {log.url}
              </Text>
              <Text
                className={`text-xs mb-2 ${log.success === 1 ? 'text-green-400' : 'text-red-400'}`}
              >
                {log.success === 1 ? 'Succès' : 'Échec'}
              </Text>
              <View className="flex-row gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    setModal({ title: 'Entrée', content: log.request_json })
                  }
                >
                  Entrée
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    setModal({ title: 'Sortie', content: log.response_json })
                  }
                >
                  Sortie
                </Button>
              </View>
            </View>
          ))}
        </ScrollView>
        <Modal visible={modal !== null} animationType="slide">
          <View className="flex-1 bg-gray-900 p-4">
            <TouchableOpacity
              className="items-end mb-4"
              onPress={() => setModal(null)}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <ScrollView>
              <Text className="text-white font-mono">
                {modal?.content}
              </Text>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Layout>
  );
}

import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity } from 'react-native';
import Layout from '@/components/ui/Layout';
import Button from '@/components/ui/Button';
import { Trash2, X } from 'lucide-react-native';
import { useLogs, useClearLogs } from '@/api/logs';

export default function LogScreen() {
  const { data: logs } = useLogs();
  const clearLogs = useClearLogs();
  const [modal, setModal] = useState<{ title: string; content: string } | null>(
    null,
  );

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="p-4 flex-1">
        <View className="items-end mb-4">
          <TouchableOpacity onPress={() => clearLogs.mutate()}>
            <Trash2 color="#fff" size={24} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {logs?.map((log: any) => (
            <View
              key={log.id}
              className="mb-4 p-3 bg-white/10 rounded"
            >
              <Text className="text-white text-xs mb-1">
                {new Date(log.date).toLocaleString()} - {log.method} {log.url}
              </Text>
              <Text
                className={`text-xs mb-2 ${log.success ? 'text-green-400' : 'text-red-400'}`}
              >
                {log.success ? 'Succès' : 'Échec'}
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

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity } from 'react-native';
import Layout from '@/components/ui/Layout';
import Button from '@/components/ui/Button';
import { X } from 'lucide-react-native';
import { getDb } from '@/data/db';

export default function BddScreen() {
  const db = getDb();
  const [tables, setTables] = useState<string[]>([]);
  const [modal, setModal] = useState<{ table: string; rows: any[] } | null>(null);

  useEffect(() => {
    const loadTables = async () => {
      const res = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
      );
      setTables(res.map((r: any) => r.name));
    };
    loadTables();
  }, []);

  const openTable = async (table: string) => {
    const rows = await db.getAllAsync(`SELECT * FROM ${table};`);
    setModal({ table, rows });
  };

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="p-4 flex-1">
        {tables.map((table) => (
          <View key={table} className="mb-2">
            <Button variant="secondary" onPress={() => openTable(table)}>
              {table}
            </Button>
          </View>
        ))}
        <Modal visible={modal !== null} animationType="slide">
          <View className="flex-1 bg-gray-900 p-4">
            <TouchableOpacity
              className="items-end mb-4"
              onPress={() => setModal(null)}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <ScrollView>
              <Text className="text-white font-mono mb-2">
                {modal?.table}
              </Text>
              {modal?.rows.map((row, idx) => (
                <Text key={idx} className="text-white font-mono mb-2">
                  {JSON.stringify(row, null, 2)}
                </Text>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Layout>
  );
}


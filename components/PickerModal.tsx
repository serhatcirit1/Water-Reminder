// ============================================
// PICKER MODAL - Özelleştirilebilir Seçici
// ============================================
// Modal içinde picker ile değer seçimi

import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface PickerModalProps {
    visible: boolean;
    title: string;
    value: string | number;
    options: Array<{ label: string; value: string | number }>;
    onSelect: (value: string | number) => void;
    onClose: () => void;
}

export function PickerModal({ visible, title, value, options, onSelect, onClose }: PickerModalProps) {
    const [seciliDeger, setSeciliDeger] = useState(value);

    const handleConfirm = () => {
        onSelect(seciliDeger);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity activeOpacity={1} style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                    </View>

                    <Picker
                        selectedValue={seciliDeger}
                        onValueChange={(itemValue) => setSeciliDeger(itemValue)}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                    >
                        {options.map((option) => (
                            <Picker.Item
                                key={option.value.toString()}
                                label={option.label}
                                value={option.value}
                                color="#FFFFFF"
                            />
                        ))}
                    </Picker>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.confirmText}>Tamam</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

// Saat Seçici Modal
interface TimePickerModalProps {
    visible: boolean;
    title: string;
    hour: number;
    minute?: number;
    onSelect: (hour: number, minute: number) => void;
    onClose: () => void;
}

export function TimePickerModal({ visible, title, hour, minute = 0, onSelect, onClose }: TimePickerModalProps) {
    const [seciliSaat, setSeciliSaat] = useState(hour);
    const [seciliDakika, setSeciliDakika] = useState(minute);

    // Saat seçenekleri (0-23)
    const saatSecenekleri = Array.from({ length: 24 }, (_, i) => ({
        label: i.toString().padStart(2, '0'),
        value: i
    }));

    // Dakika seçenekleri (0, 15, 30, 45)
    const dakikaSecenekleri = [
        { label: '00', value: 0 },
        { label: '15', value: 15 },
        { label: '30', value: 30 },
        { label: '45', value: 45 },
    ];

    const handleConfirm = () => {
        onSelect(seciliSaat, seciliDakika);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity activeOpacity={1} style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                    </View>

                    <View style={styles.timePickerRow}>
                        <Picker
                            selectedValue={seciliSaat}
                            onValueChange={(itemValue) => setSeciliSaat(Number(itemValue))}
                            style={styles.timePicker}
                            itemStyle={styles.pickerItem}
                        >
                            {saatSecenekleri.map((option) => (
                                <Picker.Item
                                    key={option.value}
                                    label={option.label}
                                    value={option.value}
                                    color="#FFFFFF"
                                />
                            ))}
                        </Picker>

                        <Text style={styles.timeSeparator}>:</Text>

                        <Picker
                            selectedValue={seciliDakika}
                            onValueChange={(itemValue) => setSeciliDakika(Number(itemValue))}
                            style={styles.timePicker}
                            itemStyle={styles.pickerItem}
                        >
                            {dakikaSecenekleri.map((option) => (
                                <Picker.Item
                                    key={option.value}
                                    label={option.label}
                                    value={option.value}
                                    color="#FFFFFF"
                                />
                            ))}
                        </Picker>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.confirmText}>Tamam</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#1565C0',
        borderRadius: 20,
        width: '85%',
        maxWidth: 350,
        overflow: 'hidden',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1976D2',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    picker: {
        width: '100%',
        height: Platform.OS === 'ios' ? 200 : 50,
        backgroundColor: '#0D47A1',
    },
    pickerItem: {
        fontSize: 18,
        color: '#FFFFFF',
    },
    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0D47A1',
        paddingVertical: 10,
    },
    timePicker: {
        width: 100,
        height: Platform.OS === 'ios' ? 200 : 50,
    },
    timeSeparator: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginHorizontal: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#1976D2',
    },
    cancelButton: {
        flex: 1,
        padding: 15,
        borderRightWidth: 1,
        borderRightColor: '#1976D2',
    },
    cancelText: {
        fontSize: 16,
        color: '#90CAF9',
        textAlign: 'center',
    },
    confirmButton: {
        flex: 1,
        padding: 15,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4FC3F7',
        textAlign: 'center',
    },
});

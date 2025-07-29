import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  drawerContainer: {
    backgroundColor: '#fff',
    width: 250,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    paddingTop: 40,
    elevation: 4,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    justifyContent: 'flex-start',
  },
});

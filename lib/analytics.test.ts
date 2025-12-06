import { trackGAEvent } from './analytics'

// Mock window and gtag function
const mockGtag = jest.fn()
Object.defineProperty(global, 'window', {
  value: {
    gtag: mockGtag
  },
  writable: true
})

describe('Analytics', () => {
  beforeEach(() => {
    mockGtag.mockClear()
  })

  describe('trackGAEvent', () => {
    it('should call gtag with correct parameters', () => {
      trackGAEvent('button_click', 'location_actions', 'Get Directions - Test Location', 1, {
        button_type: 'get_directions',
        name: 'Test Location'
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'button_click', {
        event_category: 'location_actions',
        event_label: 'Get Directions - Test Location',
        value: 1,
        button_type: 'get_directions',
        name: 'Test Location'
      })
    })

    it('should handle missing optional parameters', () => {
      trackGAEvent('button_click', 'location_actions')

      expect(mockGtag).toHaveBeenCalledWith('event', 'button_click', {
        event_category: 'location_actions',
        event_label: undefined,
        value: undefined
      })
    })
  })
}) 
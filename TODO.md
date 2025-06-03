# TODO List

## Immediate Priority

### Playwright Test Updates (High Priority)
Following the UI simplification changes, several e2e tests need updating:

1. **Text Content Updates**:
   - Tests looking for "SDXL" should look for "Stable Diffusion XL"
   - Tests looking for "Jaime Creator" should look for "Jaime Model" 
   - Tests looking for "Generate Image" buttons need to match new button text

2. **Element Selectors**:
   - Update selectors that target prompt input fields (now textarea instead of input)
   - Update selectors for back buttons on model pages
   - Update selectors for template selection dropdowns

3. **Test Flow Updates**:
   - Update storyboard creation tests to match new form layout
   - Update generation flow tests for simplified UI
   - Update mobile responsiveness tests for new button styles

### Specific Files to Update:
- `e2e/complete-user-flow.spec.ts` - Main test file with multiple failures
- Update test timeouts if generation UI is more responsive
- Verify authentication flow tests still work with simplified UI

## Lower Priority

### General Improvements
- Consider adding tests for the new prompt templates
- Test the new multi-line textarea functionality
- Add tests for back button navigation
- Test image domain configuration (picsum.photos)

## Completed ✅
- ✅ UI Simplification (removed technical controls)
- ✅ Back button implementation across all model pages
- ✅ Enhanced prompt input with textarea
- ✅ Documentation updates
- ✅ Image domain configuration fixes 
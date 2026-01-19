namespace QLDT.Domain.ValueObjects;

public class VocabularyItem
{
    public string Word { get; set; } = string.Empty;
    public string? PartOfSpeech { get; set; }
    public string Translation { get; set; } = string.Empty;
}

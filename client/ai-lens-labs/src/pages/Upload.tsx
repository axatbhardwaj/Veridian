import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { WalletButton } from '@/components/WalletButton';
import { keccak256 } from 'js-sha3';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState(['', '', '']);
  const [isUploading, setIsUploading] = useState(false);
  const { isConnected, account } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.md')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a Markdown (.md) file only.",
          variant: "destructive",
        });
      }
    }
  };

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  const calculateKeccak256 = (content: string): string => {
    return keccak256(content);
  };

  const handleUpload = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to upload content.",
        variant: "destructive",
      });
      return;
    }

    if (!file || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a markdown file.",
        variant: "destructive",
      });
      return;
    }

    const validKeywords = keywords.filter(keyword => keyword.trim() !== '');
    if (validKeywords.length === 0) {
      toast({
        title: "Keywords Required",
        description: "Please provide at least one keyword for your content.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileContent = await file.text();
      
      // Calculate Keccak-256 hash of the content
      const contentHash = calculateKeccak256(fileContent);
      console.log('Content Hash (Keccak-256):', contentHash);
      console.log('File Name:', file.name);
      console.log('File Size:', file.size, 'bytes');
      console.log('Title:', title);
      console.log('Keywords:', keywords.filter(k => k.trim() !== ''));
      
      // Prepare form data for API call
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('keywords', JSON.stringify(keywords.filter(k => k.trim() !== '')));
      formData.append('userAddress', account || '');
      
      // Call the API endpoint
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Upload failed:', result);
        throw new Error(result.error || 'Upload failed');
      }
      
      console.log('Upload successful:', result);
      
      toast({
        title: "Upload Successful",
        description: "Your content has been uploaded and is pending validation.",
      });
      
      // Reset form
      setFile(null);
      setTitle('');
      setKeywords(['', '', '']);
      
      // Redirect to dashboard (when implemented)
      navigate('/');
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', error.message);
      toast({
        title: "Upload Failed",
        description: `There was an error uploading your content: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-xl font-bold">Upload Content</h1>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm min-h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Upload Your Content
              </CardTitle>
              <CardDescription>
                Share your knowledge and earn crypto rewards. Upload markdown files containing articles, research, or unique insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {!isConnected && (
                <div className="p-4 rounded-lg bg-accent/50 border border-accent">
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to start uploading content and earning rewards.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a compelling title for your content"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!isConnected}
                />
              </div>

              <div className="space-y-2">
                <Label>Keywords *</Label>
                <div className="space-y-3">
                  {keywords.map((keyword, index) => (
                    <Input
                      key={index}
                      placeholder={`Keyword ${index + 1} (e.g., AI, blockchain, research)`}
                      value={keyword}
                      onChange={(e) => handleKeywordChange(index, e.target.value)}
                      disabled={!isConnected}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Provide up to 3 keywords that best describe your content. At least one keyword is required.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Markdown File *</Label>
                <div className="relative w-full">
                  <Input
                    id="file"
                    type="file"
                    accept=".md"
                    onChange={handleFileChange}
                    disabled={!isConnected}
                    className="w-full h-[50px] px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-10 w-4" />
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your content will be reviewed by validators</li>
                  <li>• Validators rate content quality (1-10 scale)</li>
                  <li>• Pricing is automatically set based on ratings</li>
                  <li>• You earn crypto when AI models purchase access</li>
                </ul>
              </div> */}

              <Button
                onClick={handleUpload}
                disabled={!isConnected || !file || !title.trim() || keywords.every(k => k.trim() === '') || isUploading}
                className="w-full gap-2 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
                size="lg"
              >
                <UploadIcon className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload Content'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
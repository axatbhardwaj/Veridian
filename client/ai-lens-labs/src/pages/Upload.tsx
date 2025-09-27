import { useState, useEffect } from 'react';
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
import { Contract, parseEther, formatEther } from 'ethers';
import { contractAddress, contractABI } from '@/contract';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState(['', '', '']);
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'analyzing' | 'minting' | 'storing' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [mintFeeEth, setMintFeeEth] = useState<string | null>(null);
  const { isConnected, account, provider } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch mint fee when wallet is connected
  useEffect(() => {
    const fetchMintFee = async () => {
      if (isConnected && provider) {
        try {
          const signer = await provider.getSigner();
          const contract = new Contract(contractAddress, contractABI, signer);
          const mintFeeWei = await contract.mintFeeWei();
          const mintFeeEthValue = formatEther(mintFeeWei);
          setMintFeeEth(mintFeeEthValue);
        } catch (error) {
          console.error('Failed to fetch mint fee:', error);
          setMintFeeEth(null);
        }
      } else {
        setMintFeeEth(null);
      }
    };

    fetchMintFee();
  }, [isConnected, provider]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.md') || selectedFile.name.endsWith('.mdx') ) {
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

  const generateKeywordsAndPrice = async (title: string, content: string): Promise<{ keywords: string[], price: number }> => {
    try {
      setIsGeneratingKeywords(true);
      setCurrentStep('analyzing');
      setProgress(10);
      
      toast({
        title: "🔮 Analyzing Content",
        description: "AI is analyzing your content to generate keywords and pricing...",
      });
      
      // Try the new /evaluate endpoint first, fallback to /generate_keywords
      const useNewEndpoint = true;
      
      const endpoint = useNewEndpoint ? '/evaluate' : '/generate_keywords';
      const requestBody = useNewEndpoint 
        ? { title, markdown: content }
        : { title, content };
      
      setProgress(30);
      
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      setProgress(60);
      
      if (!response.ok) {
        // If new endpoint fails, try the legacy endpoint
        if (useNewEndpoint) {
          console.log('New endpoint failed, trying legacy endpoint...');
          toast({
            title: "🔄 Retrying",
            description: "Trying alternative analysis endpoint...",
          });
          
          const fallbackResponse = await fetch('http://localhost:8000/generate_keywords', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, content }),
          });
          
          if (!fallbackResponse.ok) {
            const errorText = await fallbackResponse.text();
            throw new Error(`Analysis service unavailable (${fallbackResponse.status}). Please try again later.`);
          }
          
          const fallbackResult = await fallbackResponse.json();
          setProgress(100);
          
          toast({
            title: "✅ Analysis Complete",
            description: `Generated ${fallbackResult.keywords?.length || 0} keywords`,
          });
          
          const fallbackPrice = fallbackResult.price_per_call && fallbackResult.price_per_call > 0 
            ? fallbackResult.price_per_call 
            : 1.00;
            
          return {
            keywords: fallbackResult.keywords || [],
            price: fallbackPrice
          };
        }
        
        const errorText = await response.text();
        throw new Error(`Analysis failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Generated keywords and price:', result);
      
      setProgress(100);
      
      toast({
        title: "✅ Analysis Complete",
        description: `Generated ${result.keywords?.length || 0} keywords with smart pricing`,
      });
      
      // Handle both response formats and ensure valid price
      let calculatedPrice = 1.00; // Default fallback price
      
      if (useNewEndpoint && result.price_usdc_cents) {
        calculatedPrice = result.price_usdc_cents / 100.0; // Convert cents to dollars
      } else if (result.price_per_call) {
        calculatedPrice = result.price_per_call;
      }
      
      // Ensure price is always valid (greater than 0)
      if (!calculatedPrice || calculatedPrice <= 0) {
        console.warn('Invalid price received from API, using fallback price of 1.00');
        calculatedPrice = 1.00;
      }
      
      return {
        keywords: result.keywords || [],
        price: calculatedPrice
      };
    } catch (error: any) {
      console.error('Error generating keywords:', error);
      
      toast({
        title: "❌ Analysis Failed",
        description: error.message || "Failed to analyze content. Please check your connection and try again.",
        variant: "destructive",
      });
      
      throw new Error(error.message || 'Failed to generate keywords. Please try again.');
    } finally {
      setIsGeneratingKeywords(false);
      setProgress(0);
    }
  };

  const mintNFT = async (title: string, keywords: string[], contentHash: string, tokenUri: string, price: number): Promise<string | null> => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }

    // Validate price parameter
    if (!price || price <= 0) {
      throw new Error('Invalid price provided. Price must be greater than zero.');
    }

    try {
      setIsMinting(true);
      setCurrentStep('minting');
      setProgress(10);
      
      toast({
        title: "🔗 Preparing Blockchain Transaction",
        description: "Setting up smart contract interaction...",
      });
      
      // Get signer from provider
      const signer = await provider.getSigner();
      
      // Create contract instance
      const contract = new Contract(contractAddress, contractABI, signer);
      
      setProgress(20);
      
      // Prepare parameters for minting
      const keywordsCsv = keywords.filter(k => k.trim() !== '').join(',');
      
      // Ensure content hash is exactly 64 characters (32 bytes)
      const cleanHash = contentHash.replace('0x', '').padStart(64, '0');
      const contentHashBytes32 = '0x' + cleanHash;
      
      const priceUsdcCents = Math.round(price * 100); // Convert price to cents
      
      // Debug logging for price validation
      console.log('Price validation - price parameter:', price);
      console.log('Price validation - priceUsdcCents:', priceUsdcCents);
      
      // Validate parameters before minting
      if (priceUsdcCents <= 0) {
        throw new Error('Invalid price: Price must be greater than zero. Please try regenerating the price.');
      }
      
      if (!title.trim()) {
        throw new Error('Title cannot be empty.');
      }
      
      if (!contentHashBytes32 || contentHashBytes32 === '0x' + '0'.repeat(64)) {
        throw new Error('Invalid content hash. Please try uploading again.');
      }
      
      if (!tokenUri.trim()) {
        throw new Error('Token URI cannot be empty.');
      }
      
      console.log('Minting NFT with parameters:', {
        title: title.substring(0, 100), // Limit title length
        keywordsCsv: keywordsCsv.substring(0, 200), // Limit keywords length
        tokenUri: tokenUri.substring(0, 500), // Limit URI length
        contentHash: contentHashBytes32,
        priceUsdcCents
      });
      
      setProgress(30);
      
      toast({
        title: "� Getting Mint Fee",
        description: "Fetching required mint fee from contract...",
      });
      
      // Get the required mint fee from the contract
      let mintFeeWei;
      try {
        mintFeeWei = await contract.mintFeeWei();
        console.log('Mint fee required (Wei):', mintFeeWei.toString());
        console.log('Mint fee required (ETH):', formatEther(mintFeeWei));
      } catch (feeError: any) {
        console.error('Failed to get mint fee:', feeError);
        throw new Error('Failed to get mint fee from contract. Please try again.');
      }
      
      setProgress(40);
      
      toast({
        title: "�🔍 Checking Content Uniqueness",
        description: "Verifying content hasn't been uploaded before...",
      });
      
      // Check if content hash already exists
      try {
        const existingTokenId = await contract.contentHashToTokenId(contentHashBytes32);
        if (existingTokenId && existingTokenId.toString() !== '0') {
          throw new Error('Content with this hash already exists. Please modify your content or try again.');
        }
      } catch (checkError: any) {
        // If the check fails due to non-existent hash, that's what we want
        if (!checkError.message.includes('already exists')) {
          console.log('Content hash check completed - hash is unique');
        } else {
          throw checkError;
        }
      }
      
      setProgress(50);
      
      toast({
        title: "⛽ Estimating Gas",
        description: "Calculating transaction costs...",
      });
      
      // Debug: Log all parameters before gas estimation
      console.log('Debug - Parameters for mint function:');
      console.log('  title (truncated):', title.substring(0, 100));
      console.log('  keywordsCsv (truncated):', keywordsCsv.substring(0, 200));
      console.log('  tokenUri (truncated):', tokenUri.substring(0, 500));
      console.log('  contentHashBytes32:', contentHashBytes32);
      console.log('  priceUsdcCents:', priceUsdcCents);
      console.log('  mintFeeWei:', mintFeeWei.toString());
      console.log('  account (caller):', account);
      
      // Estimate gas first to catch errors early
      try {
        const gasEstimate = await contract.mint.estimateGas(
          title.substring(0, 100),
          keywordsCsv.substring(0, 200),
          tokenUri.substring(0, 500),
          contentHashBytes32,
          priceUsdcCents,
          {
            value: mintFeeWei // Include the mint fee in the gas estimation
          }
        );
        console.log('Gas estimate:', gasEstimate.toString());
        console.log('Mint fee (Wei):', mintFeeWei.toString());
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError);
        console.error('Error data:', gasError.data);
        
        // Handle specific contract custom errors by their selector
        if (gasError.data === '0x30cd7471') {
          throw new Error('Content with this hash already exists (DuplicateContentHash). Please modify your content.');
        } else if (gasError.data === '0x9c2e4a38') {
          throw new Error('Insufficient payment sent. Please ensure you have enough ETH for the mint fee.');
        } else if (gasError.data === '0x00bfc921') {
          // This is the specific error we're seeing - add more debugging
          console.error('Price validation failed in contract. Debug info:');
          console.error('  Price parameter passed:', price);
          console.error('  PriceUsdcCents calculated:', priceUsdcCents);
          throw new Error(`Invalid price provided. Contract rejected price ${priceUsdcCents} cents (${price} USD). Please try again or contact support.`);
        } else if (gasError.data === '0xd1a57ed6') {
          throw new Error('Cannot send to zero address.');
        } else if (gasError.reason) {
          throw new Error(`Contract error: ${gasError.reason}`);
        } else if (gasError.message?.includes('execution reverted')) {
          // Try to decode the error from the contract interface
          try {
            const errorFragment = contract.interface.parseError(gasError.data);
            throw new Error(`Contract error: ${errorFragment.name} - Please check your input parameters.`);
          } catch {
            throw new Error('Transaction validation failed. The contract rejected the transaction. Please check your input data.');
          }
        } else {
          throw new Error('Transaction validation failed. Please check your input data and try again.');
        }
      }
      
      setProgress(70);
      
      toast({
        title: "📝 Submitting Transaction",
        description: `Please confirm the transaction in your wallet (includes ${formatEther(mintFeeWei)} ETH mint fee)...`,
      });
      
      // Call the mint function
      const tx = await contract.mint(
        title.substring(0, 100),
        keywordsCsv.substring(0, 200),
        tokenUri.substring(0, 500),
        contentHashBytes32,
        priceUsdcCents,
        {
          value: mintFeeWei, // Send the required mint fee
          gasLimit: 500000 // Set a reasonable gas limit
        }
      );
      
      setTransactionHash(tx.hash);
      setProgress(80);
      
      toast({
        title: "✅ Transaction Submitted",
        description: `Waiting for confirmation... Hash: ${tx.hash.slice(0, 10)}...`,
      });
      
      console.log('Transaction submitted:', tx.hash);
      
      toast({
        title: "⏳ Confirming Transaction",
        description: "Waiting for blockchain confirmation...",
      });
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      setProgress(100);
      
      console.log('Transaction confirmed:', receipt);
      
      // Extract token ID from the ContentMinted event
      const contentMintedEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog && parsedLog.name === 'ContentMinted';
        } catch {
          return false;
        }
      });
      
      let tokenId = null;
      if (contentMintedEvent) {
        const parsedLog = contract.interface.parseLog(contentMintedEvent);
        tokenId = parsedLog.args.tokenId.toString();
        console.log('NFT minted with token ID:', tokenId);
      }
      
      return tokenId;
    } catch (error: any) {
      console.error('Minting error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to mint NFT';
      let errorDescription = 'Please try again or contact support if the issue persists.';
      
      if (error.message.includes('already exists')) {
        errorMessage = 'Content Already Exists';
        errorDescription = 'This content is already on the blockchain. Please modify your content and try again.';
      } else if (error.message.includes('InsufficientPayment') || error.data === '0x9c2e4a') {
        errorMessage = 'Insufficient Payment';
        errorDescription = `Please ensure you have enough ETH to cover both the mint fee (${mintFeeEth || 'unknown'} ETH) and gas costs.`;
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'Transaction Failed';
        errorDescription = 'The blockchain rejected the transaction. This might be due to duplicate content or network issues.';
      } else if (error.message.includes('user rejected') || error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction Cancelled';
        errorDescription = 'You cancelled the transaction in your wallet.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient Funds';
        errorDescription = 'You don\'t have enough ETH to pay for the mint fee and gas costs.';
      } else if (error.reason) {
        errorMessage = 'Contract Error';
        errorDescription = error.reason;
      } else if (error.message) {
        errorMessage = 'Minting Failed';
        errorDescription = error.message;
      }
      
      toast({
        title: `❌ ${errorMessage}`,
        description: errorDescription,
        variant: "destructive",
      });
      
      throw new Error(errorMessage);
    } finally {
      setIsMinting(false);
      setProgress(0);
    }
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
      
      // First, generate keywords and calculate price using AI
      const { keywords: aiKeywords, price } = await generateKeywordsAndPrice(title, fileContent);
      
      // Ensure we have a valid price before proceeding
      if (!price || price <= 0) {
        throw new Error('Failed to generate a valid price. Please try again.');
      }
      
      setGeneratedKeywords(aiKeywords);
      setCalculatedPrice(price);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('AI Generated Keywords:', aiKeywords);
      console.log('Calculated Price:', price);
      
      // Use AI-generated keywords if manual keywords are empty
      const finalKeywords = keywords.filter(k => k.trim() !== '').length > 0 
        ? keywords.filter(k => k.trim() !== '')
        : aiKeywords;
      
      // Calculate Keccak-256 hash of the content with timestamp to ensure uniqueness
      const timestampedContent = `${fileContent}\n\n<!-- Uploaded at: ${Date.now()} by: ${account} -->`;
      const contentHash = calculateKeccak256(timestampedContent);
      console.log('Content Hash (Keccak-256):', contentHash);
      console.log('File Name:', file.name);
      console.log('File Size:', file.size, 'bytes');
      console.log('Title:', title);
      console.log('Final Keywords:', finalKeywords);
      console.log('Timestamped content length:', timestampedContent.length);
      
      // First, mint the NFT on blockchain
      let tokenId: string | null = null;
      try {
        const tokenUri = `https://veridian-api.com/metadata/${contentHash}`; // Generate metadata URI
        tokenId = await mintNFT(title, finalKeywords, contentHash, tokenUri, price);
        
        console.log('NFT minted successfully with token ID:', tokenId);
        
        toast({
          title: "NFT Minted!",
          description: `NFT minted successfully! Token ID: ${tokenId}. Now storing data...`,
        });
      } catch (mintError: any) {
        console.error('NFT minting failed:', mintError);
        toast({
          title: "Minting Failed",
          description: `NFT minting failed: ${mintError.message}`,
          variant: "destructive",
        });
        throw mintError; // Stop the process if minting fails
      }
      
      // Store the NFT token ID
      if (tokenId) {
        setMintedTokenId(tokenId);
      }
      
      // Now store the data in database with NFT information
      try {
        setIsStoring(true);
        setCurrentStep('storing');
        setProgress(10);
        
        toast({
          title: "💾 Storing Metadata",
          description: "Saving your content metadata to the database...",
        });
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('keywords', JSON.stringify(finalKeywords));
        formData.append('userAddress', account || '');
        formData.append('price', price.toString());
        formData.append('contentHash', contentHash);
        if (tokenId) {
          formData.append('tokenId', tokenId);
        }
        if (transactionHash) {
          formData.append('transactionHash', transactionHash);
        }
        
        setProgress(50);
        
        // Call the API endpoint
        const response = await fetch('http://localhost:5402/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        setProgress(80);
        
        const result = await response.json();
        
        if (!response.ok) {
          console.error('Database storage failed:', result);
          toast({
            title: "⚠️ Partial Success",
            description: `NFT minted successfully (Token ID: ${tokenId}) but metadata storage failed. Your NFT is secure on the blockchain.`,
            variant: "destructive",
          });
          // Don't throw error here - NFT is already minted
        } else {
          console.log('Data stored successfully:', result);
          
          setProgress(100);
          setCurrentStep('complete');
          
          toast({
            title: "🎉 Complete Success!",
            description: `Your content is now live! NFT Token ID: ${tokenId}`,
          });
        }
      } catch (storageError: any) {
        console.error('Database storage error:', storageError);
        toast({
          title: "⚠️ Partial Success",
          description: `NFT minted successfully (Token ID: ${tokenId}) but metadata storage failed. Your NFT is secure on the blockchain.`,
          variant: "destructive",
        });
        // Don't throw error - NFT is already minted
      } finally {
        setIsStoring(false);
      }
      
      // Reset form
      setFile(null);
      setTitle('');
      setKeywords(['', '', '']);
      
      // Redirect to dashboard (when implemented)
      navigate('/');
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error details:', error.message);
      
      // Reset progress and step
      setProgress(0);
      setCurrentStep('idle');
      
      // Don't show another toast if one was already shown in the specific error handler
      if (!error.message.includes('Analysis Failed') && !error.message.includes('Minting Failed')) {
        toast({
          title: "❌ Upload Failed",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
      setIsGeneratingKeywords(false);
      setIsMinting(false);
      setIsStoring(false);
      // Keep progress visible if completed successfully
      if (currentStep !== 'complete') {
        setProgress(0);
        setCurrentStep('idle');
      }
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
                  disabled={!isConnected || isGeneratingKeywords || isUploading || isMinting || isStoring}
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
                      disabled={!isConnected || isGeneratingKeywords || isUploading || isMinting || isStoring}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Provide up to 3 keywords that best describe your content. Leave empty to use AI-generated keywords.
                </p>
              </div>

              {(generatedKeywords.length > 0 || calculatedPrice !== null) && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="font-medium mb-2">AI Analysis Results</h4>
                  {generatedKeywords.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground mb-1">Generated Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {generatedKeywords.map((keyword, index) => (
                          <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {calculatedPrice !== null && (
                    <p className="text-sm text-muted-foreground">
                      Calculated Price: <span className="font-medium text-foreground">${calculatedPrice.toFixed(2)} per API call</span>
                    </p>
                  )}
                </div>
              )}

              {isConnected && mintFeeEth && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💰 Minting Fee</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    A minting fee of <span className="font-medium">{mintFeeEth} ETH</span> is required to create your NFT. This fee supports the network and ensures content authenticity.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="file">Markdown File *</Label>
                <div className="relative w-full">
                  <Input
                    id="file"
                    type="file"
                    accept=".md"
                    onChange={handleFileChange}
                    disabled={!isConnected || isGeneratingKeywords || isUploading || isMinting || isStoring}
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

              {/* Progress Bar */}
              {progress > 0 && currentStep !== 'idle' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {currentStep === 'analyzing' && '🔮 Analyzing Content'}
                      {currentStep === 'minting' && '🔗 Minting NFT'}
                      {currentStep === 'storing' && '💾 Storing Metadata'}
                      {currentStep === 'complete' && '🎉 Complete!'}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Transaction Hash Display */}
              {transactionHash && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Transaction Hash:</p>
                  <p className="text-xs font-mono break-all">{transactionHash}</p>
                </div>
              )}

              {/* Success State */}
              {mintedTokenId && currentStep === 'complete' && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">🎉 Success!</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your content has been successfully uploaded and minted as NFT #{mintedTokenId}
                  </p>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!isConnected || !file || !title.trim() || isGeneratingKeywords || isUploading || isMinting || isStoring || currentStep === 'complete'}
                className="w-full gap-2 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
                size="lg"
              >
                <UploadIcon className="h-4 w-4" />
                {isGeneratingKeywords ? '🔮 Analyzing Content...' : 
                 isMinting ? '🔗 Minting NFT...' : 
                 isStoring ? '💾 Storing Data...' : 
                 currentStep === 'complete' ? '✅ Upload Complete' :
                 'Generate & Upload Content'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}